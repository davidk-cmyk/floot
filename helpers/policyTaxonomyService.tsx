import { db } from './db';

/**
 * Updates the 'departments' setting for an organization.
 * If the new department doesn't exist in the list, it's added.
 * This operation is non-critical and will log errors without throwing them,
 * ensuring that the main policy operation is not blocked.
 *
 * @param newDepartment - The department name to add.
 * @param organizationId - The ID of the organization.
 */
export const updateDepartmentSetting = async (newDepartment: string, organizationId: number): Promise<void> => {
  if (!newDepartment) return;

  try {
    const existingSetting = await db
      .selectFrom("settings")
      .where("settingKey", "=", "departments")
      .where("organizationId", "=", organizationId)
      .select("settingValue")
      .executeTakeFirst();

    const departments = (existingSetting?.settingValue as string[] | undefined) || [];

    if (!departments.includes(newDepartment)) {
      const updatedDepartments = [...departments, newDepartment];
      await db
        .insertInto("settings")
        .values({
          settingKey: "departments",
          settingValue: updatedDepartments,
          organizationId: organizationId,
        })
        .onConflict((oc) =>
          oc.columns(["settingKey", "organizationId"]).doUpdateSet({
            settingValue: updatedDepartments,
            updatedAt: new Date(),
          })
        )
        .execute();
    }
  } catch (error) {
    console.error("Error updating departments setting:", {
      department: newDepartment,
      organizationId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

/**
 * Updates the 'categories' setting for an organization.
 * If the new category doesn't exist in the list, it's added.
 * This operation is non-critical and will log errors without throwing them,
 * ensuring that the main policy operation is not blocked.
 *
 * @param newCategory - The category name to add.
 * @param organizationId - The ID of the organization.
 */
export const updateCategorySetting = async (newCategory: string, organizationId: number): Promise<void> => {
  if (!newCategory) return;

  try {
    const existingSetting = await db
      .selectFrom("settings")
      .where("settingKey", "=", "categories")
      .where("organizationId", "=", organizationId)
      .select("settingValue")
      .executeTakeFirst();

    const categories = (existingSetting?.settingValue as string[] | undefined) || [];

    if (!categories.includes(newCategory)) {
      const updatedCategories = [...categories, newCategory];
      await db
        .insertInto("settings")
        .values({
          settingKey: "categories",
          settingValue: updatedCategories,
          organizationId: organizationId,
        })
        .onConflict((oc) =>
          oc.columns(["settingKey", "organizationId"]).doUpdateSet({
            settingValue: updatedCategories,
            updatedAt: new Date(),
          })
        )
        .execute();
    }
  } catch (error) {
    console.error("Error updating categories setting:", {
      category: newCategory,
      organizationId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};