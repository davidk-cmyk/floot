import { db } from "../../../helpers/db";
import { getServerUserSession } from "../../../helpers/getServerUserSession";
import { schema, OutputType } from "./validate_POST.schema";
import superjson from "superjson";

export async function handle(request: Request) {
  try {
    const { user } = await getServerUserSession(request);
    const json = superjson.parse(await request.text());
    const { policyId } = schema.parse(json);

    const policy = await db
      .selectFrom("policies")
      .select([
        "id",
        "acknowledgmentMode",
        "quizPassingScore",
        "minReadingTimeSeconds",
        "scrollCompletionRequired",
      ])
      .where("id", "=", policyId)
      .where("organizationId", "=", user.organizationId)
      .executeTakeFirst();

    if (!policy) {
      return new Response(
        superjson.stringify({ error: "Policy not found or access denied." }),
        { status: 404 }
      );
    }

    const validationResult: OutputType = {
      canAcknowledge: false,
      requirements: {
        quizPassed: null,
        keyPointsConfirmed: null,
        minReadingTimeMet: null,
        scrollCompletionMet: null,
      },
      errors: [],
    };

    if (policy.acknowledgmentMode !== "confirmed_understanding") {
      validationResult.canAcknowledge = true;
      return new Response(superjson.stringify(validationResult));
    }

    // 1. Check Quiz
    const passingAttempt = await db
      .selectFrom("policyQuizAttempts")
      .select("id")
      .where("policyId", "=", policyId)
      .where("userId", "=", user.id)
      .where("passed", "=", true)
      .executeTakeFirst();
    validationResult.requirements.quizPassed = !!passingAttempt;

    // 2. Check Key Points
    const requiredKeyPoints = await db
      .selectFrom("policyKeyPoints")
      .select("id")
      .where("policyId", "=", policyId)
      .where("isRequired", "=", true)
      .execute();

    if (requiredKeyPoints.length > 0) {
      const confirmedKeyPoints = await db
        .selectFrom("policyKeyPointConfirmations")
        .select("keyPointId")
        .where("policyId", "=", policyId)
        .where("userId", "=", user.id)
        .where(
          "keyPointId",
          "in",
          requiredKeyPoints.map((kp) => kp.id)
        )
        .execute();
      validationResult.requirements.keyPointsConfirmed =
        confirmedKeyPoints.length >= requiredKeyPoints.length;
    } else {
      validationResult.requirements.keyPointsConfirmed = true; // No required key points
    }

    // 3. Check Reading Time
    if (policy.minReadingTimeSeconds && policy.minReadingTimeSeconds > 0) {
      const totalTimeResult = await db
        .selectFrom("policyReadingSessions")
        .select(db.fn.sum("timeSpentSeconds").as("totalTime"))
        .where("policyId", "=", policyId)
        .where("userId", "=", user.id)
        .executeTakeFirst();
      const totalTime = Number(totalTimeResult?.totalTime ?? 0);
      validationResult.requirements.minReadingTimeMet =
        totalTime >= policy.minReadingTimeSeconds;
    } else {
      validationResult.requirements.minReadingTimeMet = true; // No minimum time required
    }

    // 4. Check Scroll Completion (Placeholder - requires tracking mechanism)
    // For now, if the policy requires it, we assume it's not met unless a tracking mechanism is implemented.
    // A real implementation would check a table like `policyScrollCompletions`.
    if (policy.scrollCompletionRequired) {
      validationResult.requirements.scrollCompletionMet = false; // Needs implementation
    } else {
      validationResult.requirements.scrollCompletionMet = true;
    }

    // Final Validation
    const {
      quizPassed,
      keyPointsConfirmed,
      minReadingTimeMet,
      scrollCompletionMet,
    } = validationResult.requirements;
    validationResult.canAcknowledge =
      quizPassed &&
      keyPointsConfirmed &&
      minReadingTimeMet &&
      scrollCompletionMet;

    if (!quizPassed) validationResult.errors.push("Quiz has not been passed.");
    if (!keyPointsConfirmed)
      validationResult.errors.push("All required key points not confirmed.");
    if (!minReadingTimeMet)
      validationResult.errors.push("Minimum reading time not met.");
    if (!scrollCompletionMet)
      validationResult.errors.push("Scroll completion requirement not met.");

    return new Response(superjson.stringify(validationResult));
  } catch (error) {
    console.error("Error validating acknowledgment:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred";
    return new Response(superjson.stringify({ error: errorMessage }), {
      status: 400,
    });
  }
}