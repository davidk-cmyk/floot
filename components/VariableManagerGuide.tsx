import React from 'react';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from './Accordion';
import { Badge } from './Badge';
import { Lightbulb, AlertTriangle, BookOpen } from 'lucide-react';
import styles from './VariableManagerGuide.module.css';

const CodeBlock = ({ children }: { children: React.ReactNode }) => <pre className={styles.codeBlock}><code>{children}</code></pre>;

export const VariableManagerGuide = () => {
  return (
    <div className={styles.card}>
      <header className={styles.guideHeader}>
        <BookOpen size={32} className={styles.guideHeaderIcon} />
        <div>
          <h3 className={styles.guideTitle}>Guide to Organization Variables</h3>
          <p className={styles.guideDescription}>
            Learn how to use dynamic variables to personalize policy templates and content.
          </p>
        </div>
      </header>

      <Accordion type="multiple" defaultValue={['overview']} className={styles.guideAccordion}>
        <AccordionItem value="overview">
          <AccordionTrigger>What are Organization Variables?</AccordionTrigger>
          <AccordionContent>
            <p>
              Organization Variables are dynamic placeholders you can insert into your policies. They allow you to create
              reusable templates that automatically populate with specific information from your organization's settings,
              such as your company name, contact details, or key personnel.
            </p>
            <p>
              <strong>Benefits:</strong>
            </p>
            <ul className={styles.guideList}>
              <li>
                <strong>Consistency:</strong> Ensure key information is consistent across all documents.
              </li>
              <li>
                <strong>Efficiency:</strong> Update information in one place (Variable Manager) and have it reflect
                everywhere.
              </li>
              <li>
                <strong>Personalization:</strong> Create tailored content that feels specific to your organization.
              </li>
            </ul>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="syntax">
          <AccordionTrigger>Basic Syntax</AccordionTrigger>
          <AccordionContent>
            <p>Variables are referenced by their path, which consists of a category and a key, wrapped in forward slashes.</p>
            <p>
              The format is: <Badge variant="secondary">/category.key/</Badge>
            </p>
            <p>
              <strong>Example:</strong>
            </p>
            <CodeBlock>{`Welcome to the /company.name/ employee handbook.`}</CodeBlock>
            <p>If your company name is set to "MyPolicyPortal Inc.", this will render as:</p>
            <div className={styles.exampleOutput}>Welcome to the MyPolicyPortal Inc. employee handbook.</div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="fallbacks">
          <AccordionTrigger>Fallback Values</AccordionTrigger>
          <AccordionContent>
            <p>
              You can provide a fallback value to be used if a variable is not defined in your settings. This is useful for
              preventing blank spaces in your documents.
            </p>
            <p>
              The format is: <Badge variant="secondary">/category.key|Your Fallback Value/</Badge>
            </p>
            <p>
              <strong>Example:</strong>
            </p>
            <CodeBlock>{`For IT support, please contact /contact.supportEmail|our IT department/`}</CodeBlock>
            <p>
              If <Badge variant="outline">contact.supportEmail</Badge> is not set, this will render as:
            </p>
            <div className={styles.exampleOutput}>For IT support, please contact our IT department</div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="formatting">
          <AccordionTrigger>Formatting Options (Modifiers)</AccordionTrigger>
          <AccordionContent>
            <p>
              Modifiers allow you to format the output of a variable. They are appended after the variable path or fallback
              value, separated by a pipe character (<Badge variant="outline">|</Badge>).
            </p>
            <p>
              The format is: <Badge variant="secondary">/category.key|modifier/</Badge> or{' '}
              <Badge variant="secondary">/category.key|fallback|modifier/</Badge>
            </p>
            <p>
              <strong>Available Modifiers:</strong>
            </p>
            <ul className={styles.guideList}>
              <li>
                <Badge variant="outline">uppercase</Badge>: Converts the entire text to uppercase.
              </li>
              <li>
                <Badge variant="outline">lowercase</Badge>: Converts the entire text to lowercase.
              </li>
              <li>
                <Badge variant="outline">capitalize</Badge>: Capitalizes the first letter of each word.
              </li>
            </ul>
            <p>
              <strong>Example:</strong>
            </p>
            <CodeBlock>{`POLICY DOCUMENT: /company.name|uppercase/`}</CodeBlock>
            <p>If company name is "MyPolicyPortal Inc.", this will render as:</p>
            <div className={styles.exampleOutput}>POLICY DOCUMENT: MYPOLICYPORTAL INC.</div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="picker">
          <AccordionTrigger>Using the Variable Picker</AccordionTrigger>
          <AccordionContent>
            <p>
              The easiest way to insert variables is by using the "Insert Variable" button available in policy editors. This
              tool provides a searchable list of all your organization's variables.
            </p>
            <div className={styles.guideTipBox}>
              <Lightbulb size={16} />
              <p>
                The Variable Picker helps you avoid typos and shows you the current value of each variable, making it simple
                to find the one you need.
              </p>
            </div>
            <p>
              Simply search for a variable, select it, add an optional fallback value, and click "Insert". The correct syntax
              will be automatically added to your document.
            </p>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="troubleshooting">
          <AccordionTrigger>Troubleshooting</AccordionTrigger>
          <AccordionContent>
            <div className={styles.guideWarningBox}>
              <AlertTriangle size={16} />
              <div>
                <p>
                  <strong>A variable is not being replaced (e.g., you see /company.name/ in the final document).</strong>
                </p>
                <ul className={styles.guideList}>
                  <li>Check for typos in the variable path. It must be an exact match.</li>
                  <li>Ensure the variable is defined in the Editor tab above.</li>
                  <li>If the variable is not set, it will appear as blank unless you provide a fallback value.</li>
                </ul>
              </div>
            </div>
            <div className={styles.guideWarningBox}>
              <AlertTriangle size={16} />
              <div>
                <p>
                  <strong>A fallback value is always showing.</strong>
                </p>
                <ul className={styles.guideList}>
                  <li>This means the variable is not defined in your settings. Go to the Editor tab to set its value.</li>
                </ul>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="best-practices">
          <AccordionTrigger>Best Practices & Next Steps</AccordionTrigger>
          <AccordionContent>
            <p>To get the most out of the variable system, we recommend the following:</p>
            <ul className={styles.guideList}>
              <li>
                <strong>Be Descriptive:</strong> When creating custom variables, use clear and descriptive names (e.g.,{' '}
                <Badge variant="outline">mainOfficeAddress</Badge> instead of <Badge variant="outline">addr1</Badge>).
              </li>
              <li>
                <strong>Keep it Updated:</strong> Regularly review your organization variables to ensure they are current.
              </li>
              <li>
                <strong>Use Fallbacks:</strong> For non-critical information, use fallback values to ensure your documents are
                always readable.
              </li>
            </ul>
            <div className={styles.guideNextSteps}>
              <p>Ready to get started?</p>
              <p>
                Use the <strong>Editor</strong> tab above to manage your variables and the <strong>Preview</strong> tab to
                test how they work.
              </p>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};