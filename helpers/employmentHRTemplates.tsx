import { PolicyTemplate } from './policyTemplateModel';

export const EMPLOYMENT_HR_TEMPLATES: PolicyTemplate[] = [
  {
    id: 'hr-001',
    title: 'Disciplinary and Grievance Policy',
    description:
      'A legally required procedure for handling employee disciplinary issues and grievances fairly and consistently.',
    category: 'Employment & HR',
    type: 'required',
    estimatedTime: 20,
    content: `
# Disciplinary and Grievance Policy

## 1. Purpose
This policy outlines the procedures for handling disciplinary matters and employee grievances to ensure fairness and consistency, in line with the Acas Code of Practice.

## 2. Disciplinary Procedure
### Informal Action
Minor misconduct will be addressed informally through discussion and counselling.

### Formal Action
For more serious issues, the following stages will be followed:
1.  **Investigation:** A fair and impartial investigation will be conducted.
2.  **Written Notification:** The employee will be notified in writing of the allegations.
3.  **Disciplinary Hearing:** The employee has the right to be accompanied by a colleague or trade union representative.
4.  **Outcome:** A written decision will be provided, which may include:
    *   First Written Warning
    *   Final Written Warning
    *   Dismissal (for gross misconduct)
5.  **Appeal:** The employee has the right to appeal the decision.

## 3. Grievance Procedure
### Informal Resolution
Employees are encouraged to raise concerns informally with their line manager first.

### Formal Grievance
If informal resolution is not possible:
1.  **Submit in Writing:** The employee should submit their grievance in writing.
2.  **Grievance Meeting:** A meeting will be held to discuss the grievance. The employee has the right to be accompanied.
3.  **Outcome:** A written response will be provided.
4.  **Appeal:** The employee has the right to appeal the decision.

## 4. Record Keeping
All disciplinary and grievance records will be kept confidential and stored securely for the duration required by law.
`,
  },
  {
    id: 'hr-002',
    title: 'Equal Opportunities, Diversity & Anti-Harassment Policy',
    description:
      'Promote a diverse and inclusive workplace, preventing discrimination and harassment based on protected characteristics.',
    category: 'Employment & HR',
    type: 'required',
    estimatedTime: 25,
    content: `
# Equal Opportunities, Diversity & Anti-Harassment Policy

## 1. Our Commitment
[Your Company Name] is committed to fostering a diverse, inclusive and respectful workplace where all employees are treated with dignity and respect. We will not tolerate any form of discrimination, harassment, or victimisation.

## 2. Scope
This policy applies to all aspects of employment, including recruitment, promotion, training, working conditions, pay, disciplinary action, and termination. It also applies to our interactions with customers, suppliers, and visitors.

## 3. Protected Characteristics
We are committed to providing equal opportunities and preventing discrimination on the grounds of:
*   Age
*   Disability
*   Gender reassignment
*   Marriage and civil partnership
*   Pregnancy and maternity
*   Race (including nationality, ethnic or national origins, and colour)
*   Religion or belief
*   Sex
*   Sexual orientation

## 4. Types of Prohibited Behaviour
### Discrimination
Direct or indirect discrimination on the grounds of protected characteristics is prohibited.

### Harassment
Unwanted conduct that violates dignity or creates an intimidating, hostile, degrading, humiliating or offensive environment.

### Victimisation
Treating someone unfavourably because they have made or supported a complaint or raised a grievance under this policy.

### Bullying
Offensive, intimidating, malicious or insulting behaviour involving the misuse of power.

## 5. Reporting and Complaints
Employees who believe they have been subjected to discrimination, harassment, or bullying should:
*   Report the matter to their line manager or HR
*   Use the formal grievance procedure if informal resolution is not appropriate
*   All complaints will be investigated promptly and confidentially

## 6. Responsibilities
*   **All Employees**: Must treat colleagues with respect and dignity, and report inappropriate behaviour
*   **Managers**: Must implement this policy, lead by example, and address any concerns promptly
*   **Senior Management**: Overall responsibility for creating and maintaining an inclusive culture

## 7. Training and Development
We will provide regular training on equality, diversity and inclusion to all staff, with specific training for managers on their responsibilities.

## 8. Monitoring and Review
We will monitor the effectiveness of this policy through:
*   Regular staff surveys
*   Analysis of recruitment, promotion and retention data
*   Review of complaints and their outcomes
`,
  },
  {
    id: 'hr-003',
    title: 'Holiday, Leave & Absence Policy',
    description:
      'Comprehensive policy covering annual leave, sickness absence, parental leave, and other types of absence.',
    category: 'Employment & HR',
    type: 'required',
    estimatedTime: 30,
    content: `
# Holiday, Leave & Absence Policy

## 1. Annual Leave
### Entitlement
*   All employees are entitled to a minimum of 28 days paid annual leave (including bank holidays)
*   Part-time employees receive pro-rata entitlement
*   Additional leave may be granted with length of service (see employee handbook)

### Booking Leave
*   Leave requests should be submitted at least 2 weeks in advance
*   Approval is subject to business needs and adequate cover
*   Peak period restrictions may apply (to be communicated annually)

### Carry Over
*   Up to 5 days may be carried over to the next leave year with manager approval
*   Carried over leave must be taken within the first 3 months of the new leave year

## 2. Sickness Absence
### Reporting Absence
*   Contact your line manager by telephone before 9:30am on the first day of absence
*   Provide reason for absence and expected return date
*   Maintain regular contact during extended absence

### Certification
*   Self-certification form required for absences up to 7 days
*   GP 'fit note' required for absences over 7 days
*   Continue to provide fit notes until you return to work

### Return to Work
*   Return-to-work interview will be conducted after any period of absence
*   Occupational health referral may be arranged for frequent or long-term absence
*   Reasonable adjustments will be considered to support your return

### Statutory Sick Pay (SSP)
*   SSP is payable for up to 28 weeks for eligible employees
*   Company sick pay may be available (see contract of employment)

## 3. Parental Leave
### Maternity Leave
*   Up to 52 weeks' maternity leave available
*   Statutory Maternity Pay (SMP) or Maternity Allowance may be payable
*   Enhanced company maternity pay may apply (see contract)

### Paternity Leave
*   2 weeks' paid paternity leave available
*   Must be taken within 56 days of birth/placement

### Shared Parental Leave
*   Available to eligible parents to share up to 50 weeks of leave
*   Advance notice and eligibility criteria apply

### Adoption Leave
*   Same entitlements as maternity leave for primary adopter
*   Paternity leave available for partner

## 4. Other Types of Leave
### Compassionate/Bereavement Leave
*   Up to 3 days paid leave for immediate family bereavement
*   Additional unpaid leave may be granted at management discretion

### Medical Appointments
*   Time off for medical appointments should be arranged outside working hours where possible
*   Reasonable time off will be granted for unavoidable appointments

### Jury Service
*   Employees are entitled to time off for jury service
*   Company will pay the difference between jury service allowance and normal pay

### Emergency Time Off
*   Reasonable unpaid time off for family emergencies
*   Advance notice required where possible

## 5. Unauthorised Absence
Failure to follow absence reporting procedures or taking unauthorised leave may result in:
*   Loss of pay
*   Disciplinary action
*   Dismissal in serious cases

## 6. Record Keeping
*   All absence records will be maintained confidentially
*   Absence patterns will be monitored and addressed appropriately
*   Regular absence reviews will be conducted with persistent short-term absence
`,
  },
  {
    id: 'hr-004',
    title: 'Remote & Hybrid Working Policy',
    description:
      'Guidelines for flexible working arrangements, including remote work expectations and hybrid working models.',
    category: 'Employment & HR',
    type: 'recommended',
    estimatedTime: 20,
    content: `
# Remote & Hybrid Working Policy

## 1. Purpose
This policy sets out [Your Company Name]'s approach to remote and hybrid working arrangements, ensuring flexibility while maintaining productivity and team cohesion.

## 2. Eligibility
*   All employees may request flexible working arrangements
*   Requests will be considered based on role requirements and business needs
*   Probationary period must be completed before requesting remote working

## 3. Types of Working Arrangements
### Remote Working
*   Working from home or another approved location
*   Full-time or part-time remote arrangements available

### Hybrid Working
*   Combination of office and remote working
*   Minimum office presence may be required for certain roles
*   Core collaboration days may be designated

### Flexible Hours
*   Flexible start and finish times within core hours
*   Part-time working arrangements
*   Job sharing opportunities

## 4. Application Process
1.  Submit written request including proposed arrangement and business case
2.  Meeting with line manager to discuss
3.  Trial period (usually 3 months)
4.  Review and confirmation of permanent arrangement

## 5. Equipment and Technology
*   Company will provide necessary equipment for remote working
*   Employees responsible for secure storage and maintenance
*   IT support available for technical issues
*   Home broadband costs may be reimbursed (see expenses policy)

## 6. Health and Safety
*   Employees must ensure safe working environment at home
*   DSE assessment required for regular remote workers
*   Regular breaks and proper workstation setup essential
*   Report any health and safety concerns immediately

## 7. Communication and Collaboration
*   Regular check-ins with line manager (minimum weekly)
*   Attend all required team meetings (video calls acceptable)
*   Respond to communications within agreed timeframes
*   Use approved collaboration tools and platforms

## 8. Working Time and Availability
*   Maintain contracted working hours
*   Core hours: 10:00 AM - 3:00 PM (unless agreed otherwise)
*   Be available during agreed working hours
*   Record working time accurately

## 9. Performance Management
*   Performance measured by output and results, not hours worked
*   Regular one-to-ones and performance reviews continue as normal
*   Clear objectives and deadlines to be agreed

## 10. Data Security and Confidentiality
*   Follow all data protection and IT security policies
*   Use only approved software and cloud services
*   Secure storage of confidential information
*   Report any security incidents immediately

## 11. Expenses
*   Reasonable additional costs may be reimbursed (utilities, broadband)
*   Submit expense claims with appropriate documentation
*   Tax implications to be considered

## 12. Review and Changes
*   Arrangements reviewed annually or when circumstances change
*   Either party may request review with reasonable notice
*   Return to office working may be required if arrangement not working
`,
  },
  {
    id: 'hr-005',
    title: 'Code of Conduct',
    description:
      'Ethical standards and behavioural expectations for all employees in their professional conduct.',
    category: 'Employment & HR',
    type: 'recommended',
    estimatedTime: 18,
    content: `
# Code of Conduct

## 1. Our Values
[Your Company Name] is built on the foundation of integrity, respect, professionalism, and excellence. This Code of Conduct outlines the standards of behaviour expected from all employees.

## 2. Professional Standards
### Integrity
*   Act honestly and ethically in all business dealings
*   Be truthful and transparent in communications
*   Admit mistakes and take responsibility for actions

### Respect
*   Treat all colleagues, customers, and stakeholders with dignity and respect
*   Value diversity and different perspectives
*   Maintain professional relationships

### Professionalism
*   Maintain appropriate dress and appearance standards
*   Use professional language and communication
*   Represent the company positively at all times

## 3. Workplace Behaviour
### Attendance and Punctuality
*   Arrive on time and ready to work
*   Notify manager of any delays or absences
*   Use working time effectively and productively

### Collaboration
*   Work cooperatively with colleagues
*   Share knowledge and support team goals
*   Constructively resolve conflicts

### Communication
*   Communicate clearly and respectfully
*   Listen actively to others
*   Provide constructive feedback

## 4. Conflicts of Interest
*   Declare any potential conflicts of interest to your manager
*   Do not engage in activities that compete with company business
*   Avoid situations that could compromise professional judgement

## 5. Confidentiality
*   Protect confidential company and client information
*   Do not share sensitive information with unauthorised persons
*   Continue to respect confidentiality after leaving employment

## 6. Use of Company Resources
*   Use company property and resources responsibly
*   Personal use of company resources should be minimal and appropriate
*   Do not use company resources for personal financial gain

## 7. Health and Safety
*   Follow all health and safety procedures
*   Report hazards and incidents promptly
*   Do not attend work under the influence of alcohol or drugs

## 8. Compliance with Laws
*   Comply with all applicable laws and regulations
*   Report any suspected illegal activities
*   Cooperate with lawful investigations

## 9. Social Media and External Communications
*   Personal social media should not reflect negatively on the company
*   Do not share confidential company information online
*   Make clear when expressing personal opinions

## 10. Gifts and Entertainment
*   Do not accept gifts or entertainment that could influence business decisions
*   Modest gifts of nominal value may be acceptable
*   Declare any gifts received to your manager

## 11. Reporting Concerns
*   Report any violations of this Code immediately
*   Use appropriate channels including line managers or HR
*   Protection against retaliation for good faith reporting

## 12. Consequences
Violations of this Code may result in:
*   Coaching and additional training
*   Formal disciplinary action
*   Termination of employment
*   Legal action if appropriate
`,
  },
  {
    id: 'hr-006',
    title: 'Confidentiality & IP Assignment Policy',
    description:
      'Protect company intellectual property and confidential information, with clear IP ownership terms.',
    category: 'Employment & HR',
    type: 'required',
    estimatedTime: 25,
    content: `
# Confidentiality & Intellectual Property Assignment Policy

## 1. Purpose
This policy protects [Your Company Name]'s confidential information and intellectual property, and clarifies ownership of work created by employees.

## 2. Confidential Information
### Definition
Confidential information includes:
*   Trade secrets and proprietary processes
*   Customer lists and contact information
*   Financial information and business plans
*   Technical data and specifications
*   Marketing strategies and pricing
*   Personnel information
*   Any information marked as confidential

### Obligations
*   Keep all confidential information strictly confidential
*   Use confidential information only for authorised business purposes
*   Do not disclose to third parties without written authorisation
*   Return all confidential information upon termination

### Duration
Confidentiality obligations continue indefinitely, including after termination of employment.

## 3. Intellectual Property Ownership
### Company-Owned IP
The company owns all intellectual property created:
*   During working hours
*   Using company resources or facilities
*   In connection with company business
*   Within the scope of employment

### Types of IP Include
*   Inventions and patents
*   Copyrights and written works
*   Trademarks and branding
*   Software and code
*   Designs and processes
*   Know-how and trade secrets

### Employee Assignment
Employees automatically assign all rights in work-related IP to the company and agree to:
*   Execute additional documents to perfect company ownership
*   Assist in obtaining IP protection
*   Provide information about IP created

## 4. Personal IP
Employees retain rights to IP that:
*   Exists before employment begins
*   Is created entirely outside work using personal resources
*   Is unrelated to company business or research
*   Does not derive from confidential information

Pre-existing IP should be declared in writing upon employment.

## 5. Third-Party Information
*   Respect third-party confidential information and IP rights
*   Do not bring proprietary information from previous employers
*   Obtain proper licences for third-party software and materials
*   Report any potential IP infringement

## 6. Data Security
*   Store confidential information securely
*   Use encryption for sensitive electronic data
*   Limit access on a need-to-know basis
*   Report security incidents immediately
*   Follow IT security policies

## 7. Document Management
*   Clearly mark confidential documents
*   Limit distribution of sensitive information
*   Use secure methods for transmission
*   Dispose of confidential documents securely

## 8. Non-Disclosure Agreements
*   External parties must sign NDAs before receiving confidential information
*   Ensure NDAs are in place before discussions with customers, suppliers, or partners
*   Consult legal team for complex arrangements

## 9. Publicity and Publications
*   Obtain written approval before publishing work-related content
*   Do not use company name or affiliation without permission
*   Academic publications may require company review

## 10. Breach Response
Report immediately:
*   Suspected disclosure of confidential information
*   Potential IP infringement
*   Security breaches or data loss
*   Requests for information from unauthorised parties

## 11. Training
*   Regular training on confidentiality and IP policies
*   Specific training for employees with access to highly sensitive information
*   Updates on legal requirements and best practices

## 12. Legal Compliance
*   This policy complies with UK employment law
*   Employees have the right to make protected disclosures under whistleblowing legislation
*   Rights under competition law are not restricted
`,
  },
  {
    id: 'hr-007',
    title: 'Equity & Share Options Policy',
    description:
      'Framework for employee equity participation, including share options, vesting schedules, and exercise terms.',
    category: 'Employment & HR',
    type: 'recommended',
    estimatedTime: 30,
    content: `
# Equity & Share Options Policy

## 1. Purpose
This policy outlines [Your Company Name]'s approach to employee equity participation through share option schemes, promoting employee ownership and long-term commitment.

## 2. Scheme Overview
### Types of Equity Awards
*   **Share Options**: Right to purchase shares at a fixed price
*   **Restricted Shares**: Direct share grants with vesting conditions
*   **Performance Shares**: Shares granted based on performance criteria

### Tax-Approved Schemes
Where possible, we use HMRC-approved schemes:
*   Enterprise Management Incentive (EMI) scheme
*   Share Incentive Plan (SIP)
*   Save As You Earn (SAYE) scheme

## 3. Eligibility
### General Requirements
*   Permanent employees with minimum 6 months service
*   Working minimum 25 hours per week
*   Not subject to disciplinary action
*   Director approval for senior positions

### Participation Levels
Awards typically based on:
*   Role and seniority
*   Performance rating
*   Strategic importance to business
*   Retention considerations

## 4. Grant Process
### Approval Process
1.  Recommendation by line manager
2.  HR review for eligibility
3.  Board/Committee approval
4.  Legal documentation
5.  Communication to employee

### Grant Documentation
*   Option agreement or share certificate
*   Scheme rules and employee guide
*   Tax implications summary
*   Vesting schedule details

## 5. Vesting
### Standard Vesting Schedule
*   4-year vesting period
*   25% vesting after first year (cliff vesting)
*   Monthly vesting thereafter
*   Acceleration provisions may apply

### Vesting Conditions
*   Continued employment (service condition)
*   Performance targets (where applicable)
*   Company milestones (where applicable)

### Vesting Acceleration
May occur upon:
*   Change of control
*   IPO or trade sale
*   Death or disability
*   Redundancy (at discretion)

## 6. Exercise and Sale
### Exercise Period
*   Options typically exercisable for 10 years from grant
*   Earlier expiry on termination of employment
*   Cashless exercise may be available

### Exercise Price
*   Fixed at market value on grant date
*   Independent valuation where required
*   Currency and payment methods specified

### Sale Restrictions
*   Right of first refusal to company
*   Tag-along rights
*   Drag-along obligations
*   Lockup periods may apply

## 7. Termination of Employment
### Good Leaver
Reasons include:
*   Retirement
*   Redundancy
*   Death or disability
*   Mutual agreement

Good leavers retain:
*   Vested options (may be exercised)
*   Unvested options (typically forfeit)

### Bad Leaver
Reasons include:
*   Dismissal for cause
*   Resignation without notice
*   Breach of employment terms

Bad leavers forfeit:
*   All unvested options
*   May forfeit vested unexercised options

## 8. Tax Implications
### Income Tax
*   Tax due on exercise (difference between exercise price and market value)
*   EMI schemes may qualify for Capital Gains Tax treatment

### National Insurance
*   May be due on exercise
*   Employer may agree to cover employee NI

### Capital Gains Tax
*   Due on sale of shares
*   Business Asset Disposal Relief may apply
*   Annual exempt amount available

### Advance Tax Elections
*   Section 431 elections available for restricted shares
*   Employee must pay any additional tax

## 9. Company Events
### Change of Control
*   Accelerated vesting may apply
*   Conversion to acquiring company shares
*   Cash settlement at fair value

### Reorganisation
*   Equivalent rights in new structure
*   Professional advice on tax implications

## 10. Administration
### Record Keeping
*   Central register of option holders
*   Vesting and exercise tracking
*   Tax reporting requirements

### Communication
*   Annual statements to participants
*   Regular updates on company performance
*   Educational materials on share schemes

## 11. Governance
### Option Committee
Responsibilities include:
*   Grant approvals
*   Policy interpretation
*   Scheme administration
*   Performance target setting

### Professional Advice
*   Legal counsel for scheme design
*   Tax advisors for compliance
*   Independent valuations

## 12. Review and Amendment
*   Annual policy review
*   Changes require Board approval
*   Material changes need participant consent
*   Legal and tax implications assessment
`,
  },
  {
    id: 'hr-008',
    title: 'Employee Wellbeing Statement',
    description:
      'Comprehensive approach to supporting employee mental health, physical wellbeing, and work-life balance.',
    category: 'Employment & HR',
    type: 'recommended',
    estimatedTime: 20,
    content: `
# Employee Wellbeing Statement

## 1. Our Commitment
[Your Company Name] is committed to promoting and supporting the physical, mental, and emotional wellbeing of all our employees. We recognise that employee wellbeing is fundamental to both individual success and organisational performance.

## 2. Mental Health Support
### Awareness and Education
*   Regular mental health awareness training
*   Mental Health First Aid trained staff
*   Resources and information readily available
*   Open conversations about mental health

### Support Services
*   Employee Assistance Programme (EAP) access
*   Confidential counselling services
*   Mental health days as part of leave entitlement
*   Flexible working to support mental health needs

### Manager Training
*   Recognising signs of mental health issues
*   Conducting supportive conversations
*   Signposting to appropriate resources
*   Managing mental health-related absence

## 3. Physical Health
### Workplace Environment
*   Ergonomic workstations and equipment
*   Regular DSE assessments
*   Adequate lighting and ventilation
*   Clean and safe working environment

### Health Promotion
*   Annual health checks or screenings
*   Cycle to work scheme
*   Gym membership discounts or subsidies
*   Healthy eating options in workplace

### Occupational Health
*   Access to occupational health services
*   Return to work support after illness
*   Reasonable adjustments for health conditions
*   Regular risk assessments

## 4. Work-Life Balance
### Flexible Working
*   Flexible hours and location options
*   Job sharing and part-time opportunities
*   Compressed working weeks where suitable
*   Sabbatical leave for long-serving employees

### Leave Policies
*   Generous annual leave entitlement
*   Additional leave with service
*   Unpaid leave for special circumstances
*   Time off for family emergencies

### Workload Management
*   Regular workload reviews
*   Realistic deadlines and expectations
*   Additional resources when needed
*   Right to disconnect outside working hours

## 5. Social Wellbeing
### Team Building
*   Regular team activities and events
*   Social spaces in the workplace
*   Celebration of achievements and milestones
*   Volunteer days and community involvement

### Inclusion and Belonging
*   Diverse and inclusive workplace culture
*   Employee networks and support groups
*   Regular feedback and listening sessions
*   Anti-bullying and harassment measures

## 6. Financial Wellbeing
### Fair Compensation
*   Competitive salary and benefits
*   Regular pay reviews
*   Performance-based bonuses where appropriate
*   Transparent pay structure

### Financial Support
*   Pension scheme with employer contributions
*   Financial planning resources and advice
*   Season ticket loans
*   Emergency financial assistance scheme

## 7. Professional Development
### Career Growth
*   Regular training and development opportunities
*   Career planning and progression paths
*   Mentoring and coaching programmes
*   Educational support and study leave

### Skills Development
*   Internal and external training programmes
*   Conference attendance and networking
*   Cross-departmental learning opportunities
*   Professional membership support

## 8. Creating Psychologically Safe Environment
### Open Communication
*   Regular one-to-one meetings
*   Anonymous feedback mechanisms
*   All-hands meetings and updates
*   Open door policy for concerns

### Trust and Respect
*   Treating mistakes as learning opportunities
*   Encouraging innovation and risk-taking
*   Respecting individual differences
*   Supporting employee voice and participation

## 9. Measuring and Monitoring
### Regular Surveys
*   Annual employee wellbeing survey
*   Pulse surveys throughout the year
*   Exit interview feedback
*   Wellbeing metrics and KPIs

### Data Analysis
*   Absence rates and patterns
*   Employee retention statistics
*   Engagement scores
*   Stress-related incidents

## 10. Resources and Support
### Internal Resources
*   Designated wellbeing champions
*   HR support and guidance
*   Management referral pathways
*   Peer support networks

### External Resources
*   NHS mental health services
*   Local wellbeing organisations
*   Professional health services
*   Emergency contact numbers

## 11. Crisis Support
### Immediate Support
*   Clear escalation procedures
*   Emergency contact information
*   Crisis intervention protocols
*   Safe space provision

### Ongoing Support
*   Return to work planning
*   Reasonable adjustments
*   Ongoing monitoring and check-ins
*   Long-term wellbeing planning

## 12. Continuous Improvement
*   Regular policy review and updates
*   Incorporation of employee feedback
*   Benchmarking against best practices
*   Investment in new wellbeing initiatives
*   Training for all staff on wellbeing importance
`,
  },
  {
    id: 'hr-009',
    title: 'Diversity in Hiring Policy',
    description:
      'Ensure fair and inclusive recruitment practices that promote diversity and prevent unconscious bias.',
    category: 'Employment & HR',
    type: 'recommended',
    estimatedTime: 22,
    content: `
# Diversity in Hiring Policy

## 1. Our Commitment
[Your Company Name] is committed to building a diverse and inclusive workforce that reflects the communities we serve. We believe diversity drives innovation, creativity, and business success.

## 2. Principles
### Equal Opportunity
*   All candidates considered based on merit and ability
*   No discrimination based on protected characteristics
*   Fair and consistent application of selection criteria
*   Reasonable adjustments for disabled candidates

### Inclusive Recruitment
*   Proactive sourcing from diverse talent pools
*   Bias-free job descriptions and requirements
*   Diverse interview panels where possible
*   Cultural awareness in assessment process

## 3. Job Design and Advertisement
### Inclusive Job Descriptions
*   Avoid unnecessary requirements that may exclude groups
*   Use inclusive language and avoid jargon
*   Focus on essential skills and competencies
*   Include diversity and inclusion statement

### Advertising Channels
*   Diverse job boards and platforms
*   University careers services and societies
*   Professional networks and associations
*   Social media and employee referrals

### Flexible Working Options
*   Advertise flexible working opportunities
*   Consider part-time and job-share options
*   Remote working possibilities
*   Career returner programmes

## 4. Sourcing and Outreach
### Talent Pipeline
*   Build relationships with diverse educational institutions
*   Partner with diversity-focused recruitment agencies
*   Attend diverse career fairs and networking events
*   Develop internship and graduate programmes

### Outreach Activities
*   School and university visits
*   Industry mentoring programmes
*   Sponsorship of diversity events
*   Community partnership initiatives

## 5. Application Process
### Accessible Application
*   User-friendly application platforms
*   Alternative application formats available
*   Clear instructions and timeframes
*   Support for candidates with disabilities

### CV Screening
*   Structured screening criteria
*   Multiple reviewers to reduce bias
*   Anonymous screening where appropriate
*   Focus on relevant skills and experience

## 6. Interview Process
### Panel Composition
*   Diverse interview panels where possible
*   Mix of genders, backgrounds, and experience levels
*   Include at least one trained interviewer
*   External panel members for senior roles

### Interview Structure
*   Competency-based questioning
*   Structured scoring system
*   Consistent process for all candidates
*   Opportunity for candidates to ask questions

### Bias Reduction
*   Unconscious bias training for interviewers
*   Standardised evaluation forms
*   Post-interview discussion guidelines
*   Decision documentation requirements

## 7. Assessment and Selection
### Fair Assessment
*   Job-relevant tests and exercises
*   Reasonable adjustments for disabilities
*   Multiple assessment methods
*   Cultural sensitivity in evaluation

### Decision Making
*   Panel discussion of all candidates
*   Evidence-based decisions
*   Challenge unconscious bias
*   Document rationale for decisions

## 8. Reasonable Adjustments
### During Recruitment
*   Accessible interview venues
*   Alternative interview formats
*   Additional time for assessments
*   Communication support where needed

### Equipment and Technology
*   Screen readers and magnification
*   Hearing loops and interpreters
*   Alternative format materials
*   Assistive technology access

## 9. Data Collection and Monitoring
### Diversity Metrics
*   Application rates by demographic groups
*   Interview to offer ratios
*   Time to hire statistics
*   Source effectiveness data

### Regular Reporting
*   Quarterly diversity recruitment reports
*   Annual pay gap analysis
*   Retention rates by demographic groups
*   Management diversity statistics

## 10. Training and Development
### Recruiter Training
*   Unconscious bias awareness
*   Inclusive interviewing techniques
*   Legal requirements knowledge
*   Cultural competency development

### Manager Training
*   Diversity and inclusion leadership
*   Creating inclusive team environments
*   Performance management without bias
*   Supporting diverse team members

## 11. Partnerships
### External Organisations
*   Diversity recruitment specialists
*   Professional associations
*   Community organisations
*   Educational institutions

### Employee Networks
*   Support for employee resource groups
*   Involvement in recruitment activities
*   Mentoring and sponsorship programmes
*   Referral and networking opportunities

## 12. Continuous Improvement
### Regular Review
*   Annual policy review and updates
*   Feedback from candidates and employees
*   Benchmarking against industry standards
*   Legal compliance updates

### Innovation
*   Pilot new recruitment approaches
*   Technology solutions for bias reduction
*   Best practice sharing
*   Research and development investment

## 13. Accountability
*   Hiring manager diversity targets
*   Regular progress reviews
*   Inclusion in performance evaluations
*   Recognition and rewards for inclusive hiring
`,
  },
];