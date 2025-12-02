import { PolicyTemplate } from './policyTemplateModel';

export const DATA_PROTECTION_TEMPLATES: PolicyTemplate[] = [
  {
    id: 'dp-001',
    title: 'Data Protection Policy (UK GDPR)',
    description:
      'Essential for UK GDPR compliance. Outlines how your business collects, uses, stores, and deletes personal data.',
    category: 'Data Protection & Privacy',
    type: 'required',
    estimatedTime: 30,
    content: `
# Data Protection Policy

## 1. Introduction
[Your Company Name] is committed to complying with the UK General Data Protection Regulation (UK GDPR) and the Data Protection Act 2018. This policy outlines our approach to data protection and the rights of data subjects.

## 2. Data Protection Principles
We will process personal data in accordance with the six data protection principles:
1.  **Lawfulness, fairness and transparency**: We have a lawful basis for processing and are transparent about how we use data
2.  **Purpose limitation**: Data is collected for specified, explicit and legitimate purposes only
3.  **Data minimisation**: We only process data that is adequate, relevant and necessary
4.  **Accuracy**: Personal data is kept accurate and up to date
5.  **Storage limitation**: Data is kept no longer than necessary for the purposes
6.  **Integrity and confidentiality (security)**: Appropriate security measures protect the data

## 3. Lawful Basis for Processing
We will only process personal data where we have one of the following lawful bases:
*   Consent of the data subject
*   Performance of a contract
*   Legal obligation
*   Vital interests of the data subject
*   Public task
*   Legitimate interests (where not overridden by individual rights)

## 4. Data Subject Rights
We recognise and will uphold the following rights of data subjects:
*   **Right to be informed**: Clear information about data processing
*   **Right of access**: Individuals can access their personal data
*   **Right to rectification**: Correction of inaccurate data
*   **Right to erasure**: Deletion of data in certain circumstances
*   **Right to restrict processing**: Limiting how data is used
*   **Right to data portability**: Transfer of data in machine-readable format
*   **Right to object**: Object to processing in certain circumstances
*   **Rights in relation to automated decision making**: Protection from solely automated decisions

## 5. Data Security
We will implement appropriate technical and organisational measures including:
*   Encryption of sensitive data
*   Access controls and authentication
*   Regular security updates and patches
*   Staff training on data security
*   Secure disposal of data and equipment
*   Business continuity and disaster recovery plans

## 6. Data Breaches
### Incident Response
*   Immediate containment of the breach
*   Assessment of risk to individuals
*   Notification to ICO within 72 hours if high risk
*   Communication to affected individuals without undue delay
*   Documentation of the incident and response

### Breach Register
We maintain a register of all data breaches including:
*   Date and time of breach
*   Categories and number of individuals affected
*   Description of data involved
*   Containment measures taken
*   Assessment of potential consequences

## 7. Privacy by Design
We incorporate data protection considerations into:
*   System design and development
*   Business processes and procedures
*   Procurement and vendor selection
*   Project planning and implementation
*   Regular review and assessment

## 8. Data Protection Impact Assessments (DPIAs)
We will conduct DPIAs when processing is likely to result in high risk to individuals, including:
*   Systematic monitoring of public areas
*   Processing special category data at scale
*   Automated decision making with significant effects
*   New technologies or innovative approaches

## 9. International Transfers
*   Personal data will only be transferred outside the UK where appropriate safeguards are in place
*   We will use adequacy decisions, standard contractual clauses, or binding corporate rules
*   Regular review of transfer mechanisms and their effectiveness

## 10. Record Keeping
We maintain records of processing activities including:
*   Purposes of processing
*   Categories of data subjects and personal data
*   Recipients of data
*   International transfers
*   Time limits for deletion
*   Security measures in place

## 11. Staff Training and Awareness
*   Regular data protection training for all staff
*   Specific training for those handling personal data
*   Awareness of individual responsibilities
*   Updates on legal and regulatory changes

## 12. Third Party Processors
When using third party processors:
*   Written contracts with appropriate clauses
*   Due diligence on security measures
*   Regular monitoring and auditing
*   Clear instructions on data processing
*   Notification requirements for breaches

## 13. Contact Information
*   Data Protection Officer: [Contact details]
*   Subject access requests: [Email/address]
*   Data protection queries: [Contact details]
*   ICO registration number: [Number]
`,
  },
  {
    id: 'dp-002',
    title: 'Employee & Customer Privacy Notices',
    description:
      'Transparent privacy notices explaining how personal data is collected, used, and shared.',
    category: 'Data Protection & Privacy',
    type: 'required',
    estimatedTime: 35,
    content: `
# Employee & Customer Privacy Notices

## Employee Privacy Notice

### 1. Introduction
This privacy notice explains how [Your Company Name] collects, uses, and protects your personal data as an employee, in accordance with UK GDPR and Data Protection Act 2018.

### 2. Data Controller Information
*   Company: [Your Company Name]
*   Address: [Company Address]
*   Data Protection Officer: [Contact Details]
*   ICO Registration: [Number]

### 3. Personal Data We Collect
#### Employment Information
*   Name, address, and contact details
*   National Insurance number and tax code
*   Bank account and payroll information
*   Employment history and references
*   Right to work documentation

#### Performance and Development
*   Performance reviews and appraisals
*   Training records and certifications
*   Disciplinary and grievance records
*   Absence and holiday records

#### Health and Safety
*   Occupational health records
*   Accident and incident reports
*   DSE assessments
*   Medical information relevant to work

### 4. How We Use Your Data
#### Employment Administration
*   Processing payroll and benefits
*   Managing employment relationship
*   Compliance with legal obligations
*   Health and safety requirements

#### Performance Management
*   Conducting appraisals and reviews
*   Providing training and development
*   Making promotion decisions
*   Managing disciplinary processes

### 5. Lawful Basis for Processing
*   **Contract**: Performance of employment contract
*   **Legal Obligation**: Tax, employment law compliance
*   **Legitimate Interests**: Business operations and security
*   **Consent**: Where specifically obtained

### 6. Data Sharing
We may share your data with:
*   HMRC for tax and NI purposes
*   Pension providers
*   Occupational health providers
*   Legal advisors
*   IT support providers

### 7. Data Retention
*   Active employment records: Duration of employment + 7 years
*   Payroll records: 7 years from end of tax year
*   Health and safety records: 40 years
*   Disciplinary records: Removed after specified period

### 8. Your Rights
*   Access to your personal data
*   Correction of inaccurate data
*   Erasure in certain circumstances
*   Restriction of processing
*   Data portability
*   Object to processing

---

## Customer Privacy Notice

### 1. Introduction
This privacy notice explains how [Your Company Name] handles your personal data when you use our services or interact with us.

### 2. Data We Collect
#### Contact Information
*   Name and job title
*   Email address and phone number
*   Company name and address
*   Website and social media profiles

#### Service Information
*   Services purchased or enquired about
*   Communication preferences
*   Payment and billing information
*   Contract and agreement details

#### Technical Information
*   IP address and browser type
*   Website usage data
*   Cookie and tracking information
*   Device and location data

### 3. How We Collect Data
*   Direct provision by you
*   Automated collection through our website
*   Third-party sources (with consent)
*   Public sources

### 4. How We Use Your Data
#### Service Delivery
*   Providing requested services
*   Managing customer relationship
*   Processing payments
*   Customer support

#### Communication
*   Responding to enquiries
*   Sending service updates
*   Marketing communications (with consent)
*   Satisfaction surveys

#### Business Operations
*   Improving our services
*   Website analytics
*   Fraud prevention
*   Legal compliance

### 5. Lawful Basis for Processing
*   **Contract**: Providing services you've requested
*   **Consent**: Marketing communications
*   **Legitimate Interests**: Business operations
*   **Legal Obligation**: Regulatory compliance

### 6. Marketing Communications
*   We may send marketing emails with your consent
*   You can opt out at any time
*   We will respect your preferences
*   Third-party marketing requires separate consent

### 7. Data Sharing
We may share data with:
*   Service providers and subcontractors
*   Payment processors
*   Legal and professional advisors
*   Regulatory authorities

### 8. International Transfers
*   Some data may be transferred outside the UK
*   Appropriate safeguards will be in place
*   Standard contractual clauses or adequacy decisions
*   You can request details of safeguards

### 9. Data Retention
*   Active customer data: Duration of relationship + 7 years
*   Marketing data: Until consent withdrawn + 2 years
*   Website analytics: 26 months
*   Legal requirements may extend retention periods

### 10. Cookies
*   We use cookies to improve website functionality
*   Cookie consent banner allows preferences
*   Essential cookies for website operation
*   Analytics cookies for usage statistics

### 11. Your Rights
*   **Information**: About our data processing
*   **Access**: Copy of your personal data
*   **Rectification**: Correction of inaccurate data
*   **Erasure**: Deletion in certain circumstances
*   **Portability**: Transfer of your data
*   **Object**: To certain processing activities
*   **Withdraw consent**: For consent-based processing

### 12. Complaints
*   Contact us first with any concerns
*   Right to complain to the ICO
*   ICO helpline: 0303 123 1113
*   ICO website: ico.org.uk

### 13. Contact Us
*   Data Protection Officer: [Contact details]
*   Privacy queries: [Email address]
*   Address: [Company address]
*   Phone: [Contact number]

### 14. Updates
*   We may update this notice periodically
*   Significant changes will be communicated
*   Current version available on our website
*   Version date: [Date]
`,
  },
  {
    id: 'dp-003',
    title: 'Information Security & Acceptable Use Policy',
    description:
      'Comprehensive security guidelines covering IT systems, data handling, and acceptable use of technology resources.',
    category: 'Data Protection & Privacy',
    type: 'required',
    estimatedTime: 25,
    content: `
# Information Security & Acceptable Use Policy

## 1. Purpose
This policy establishes security standards for protecting [Your Company Name]'s information assets and defines acceptable use of IT systems and resources.

## 2. Scope
This policy applies to:
*   All employees, contractors, and third parties
*   All IT systems, devices, and networks
*   Company and personal devices used for work
*   All data and information assets

## 3. Information Classification
### Public Information
*   Marketing materials and published content
*   General company information
*   No special handling required

### Internal Information
*   Business plans and strategies
*   Financial information
*   Employee information
*   Requires appropriate protection

### Confidential Information
*   Customer data and contracts
*   Intellectual property
*   Security procedures
*   Strict access controls required

### Restricted Information
*   Highly sensitive personal data
*   Trade secrets
*   Legal and compliance matters
*   Highest level of protection

## 4. Access Control
### User Authentication
*   Strong passwords (minimum 12 characters)
*   Multi-factor authentication for sensitive systems
*   Regular password changes
*   No sharing of credentials

### Access Management
*   Principle of least privilege
*   Role-based access controls
*   Regular access reviews
*   Immediate removal on termination

### Remote Access
*   VPN required for external access
*   Approved remote access tools only
*   Secure connection requirements
*   Activity monitoring and logging

## 5. Device Security
### Company Devices
*   Endpoint protection software required
*   Automatic updates and patches
*   Device encryption mandatory
*   Asset tracking and inventory

### Personal Devices (BYOD)
*   Written agreement required
*   Security software installation
*   Regular security updates
*   Remote wipe capability

### Mobile Device Management
*   Device registration and approval
*   Security policy enforcement
*   Application whitelisting
*   Lost/stolen device procedures

## 6. Network Security
### Network Access
*   Secure Wi-Fi with WPA3 encryption
*   Guest network for visitors
*   Network segmentation
*   Firewall protection

### Internet Usage
*   Business purposes primarily
*   Limited personal use permitted
*   Prohibited activities defined
*   Web filtering and monitoring

### Wireless Security
*   Strong encryption protocols
*   Regular password changes
*   Separate networks for different purposes
*   Rogue access point detection

## 7. Email and Communications
### Email Security
*   Phishing awareness training
*   Spam and malware filtering
*   Email encryption for sensitive data
*   Suspicious email reporting

### Acceptable Email Use
*   Professional communication
*   No personal business use
*   Respect for recipients
*   Confidentiality considerations

### Instant Messaging
*   Approved platforms only
*   No sensitive data sharing
*   Professional conduct
*   Retention policy compliance

## 8. Data Handling
### Data Storage
*   Approved cloud services only
*   Local storage restrictions
*   Backup and recovery procedures
*   Data classification requirements

### Data Transmission
*   Encryption for sensitive data
*   Secure file transfer methods
*   Email encryption where required
*   Physical media controls

### Data Disposal
*   Secure deletion procedures
*   Certificate of destruction
*   Hard drive wiping standards
*   Physical destruction where required

## 9. Incident Management
### Security Incidents
*   Immediate reporting required
*   Incident response team activation
*   Evidence preservation
*   Communication procedures

### Breach Response
*   Containment and assessment
*   Notification requirements
*   Remediation actions
*   Lessons learned review

### Business Continuity
*   Backup and recovery procedures
*   Alternative working arrangements
*   Communication during incidents
*   Regular testing and updates

## 10. Software and Applications
### Approved Software
*   Software approval process
*   Licence compliance
*   Security assessment required
*   Regular updates and patches

### Prohibited Software
*   Unlicensed or pirated software
*   Peer-to-peer file sharing
*   Cryptocurrency mining
*   Unauthorised remote access tools

### Cloud Services
*   Approved cloud providers only
*   Data location requirements
*   Security assessment
*   Contract review requirements

## 11. Physical Security
### Office Security
*   Access control systems
*   Visitor management
*   Clean desk policy
*   Secure storage of sensitive documents

### Equipment Security
*   Asset tagging and tracking
*   Secure equipment disposal
*   Maintenance and repair procedures
*   Theft prevention measures

## 12. Training and Awareness
### Security Training
*   Annual security awareness training
*   Phishing simulation exercises
*   Role-specific training
*   New employee orientation

### Ongoing Awareness
*   Security bulletins and updates
*   Best practice communications
*   Incident sharing (anonymised)
*   Regular policy reminders

## 13. Monitoring and Compliance
### System Monitoring
*   Network traffic analysis
*   Log review and retention
*   Intrusion detection systems
*   User activity monitoring

### Compliance Audits
*   Regular security assessments
*   Vulnerability scans
*   Penetration testing
*   Third-party audits

## 14. Violations and Consequences
### Policy Violations
*   Investigation procedures
*   Disciplinary actions
*   Corrective measures
*   Legal action where appropriate

### Reporting Violations
*   Multiple reporting channels
*   Anonymous reporting option
*   No retaliation policy
*   Investigation confidentiality

## 15. Third Party Requirements
### Vendor Management
*   Security assessments
*   Contractual security requirements
*   Regular monitoring
*   Incident notification requirements

### Customer Requirements
*   Security questionnaire responses
*   Certification compliance
*   Audit cooperation
*   Incident notification procedures
`,
  },
  {
    id: 'dp-004',
    title: 'Customer Data Handling Policy',
    description:
      'Specific guidelines for collecting, processing, storing, and sharing customer personal data in compliance with UK GDPR.',
    category: 'Data Protection & Privacy',
    type: 'required',
    estimatedTime: 28,
    content: `
# Customer Data Handling Policy

## 1. Purpose
This policy ensures [Your Company Name] handles customer personal data in compliance with UK GDPR and maintains customer trust through responsible data practices.

## 2. Scope
This policy covers:
*   All customer personal data
*   Prospective customer data
*   Third-party data shared with us
*   All staff handling customer data

## 3. Data Collection Principles
### Lawful Collection
*   Valid lawful basis for all data collection
*   Clear purpose defined before collection
*   Minimal data collection approach
*   Transparent collection practices

### Customer Consent
*   Freely given, specific, and informed
*   Clear consent mechanisms
*   Easy withdrawal process
*   Separate consent for different purposes

### Data Minimisation
*   Collect only necessary data
*   Regular review of data requirements
*   Avoid excessive data collection
*   Purpose-specific collection

## 4. Types of Customer Data
### Contact Information
*   Name and title
*   Email address and phone number
*   Business address
*   Communication preferences

### Service Information
*   Products and services used
*   Account and billing information
*   Support and communication history
*   Usage and performance data

### Technical Data
*   IP addresses and device information
*   Website usage analytics
*   Cookies and tracking data
*   System interaction logs

### Special Category Data
*   Health information (where relevant)
*   Biometric data
*   Requires explicit consent
*   Enhanced security measures

## 5. Data Processing Activities
### Customer Onboarding
*   Identity verification procedures
*   Know Your Customer (KYC) checks
*   Due diligence requirements
*   Data validation processes

### Service Delivery
*   Account management
*   Service provisioning
*   Performance monitoring
*   Issue resolution

### Customer Communication
*   Service notifications
*   Marketing communications (with consent)
*   Customer surveys
*   Renewal and upselling

## 6. Data Sharing and Disclosure
### Authorised Sharing
*   Service providers and subcontractors
*   Professional advisors
*   Regulatory authorities (when required)
*   With customer consent

### Third-Party Processors
*   Written agreements required
*   Data Processing Agreements (DPAs)
*   Security and confidentiality clauses
*   Regular monitoring and audits

### International Transfers
*   Adequate protection verification
*   Standard Contractual Clauses (SCCs)
*   Binding Corporate Rules
*   Customer notification requirements

## 7. Data Storage and Security
### Storage Locations
*   UK-based servers preferred
*   Cloud storage security requirements
*   Physical security measures
*   Access controls and monitoring

### Encryption Requirements
*   Data at rest encryption
*   Data in transit encryption
*   Key management procedures
*   Regular encryption reviews

### Backup and Recovery
*   Regular automated backups
*   Secure backup storage
*   Recovery testing procedures
*   Business continuity planning

## 8. Data Retention
### Retention Schedules
*   Active customer data: Duration of relationship + 7 years
*   Marketing data: Until consent withdrawn
*   Financial records: 7 years minimum
*   Legal hold requirements

### Deletion Procedures
*   Secure deletion methods
*   Multi-location deletion
*   Certificate of destruction
*   Regular deletion audits

### Archive Management
*   Long-term storage requirements
*   Archive access procedures
*   Periodic archive reviews
*   Migration planning

## 9. Customer Rights Management
### Subject Access Requests
*   Response within 1 month
*   Identity verification required
*   Free of charge (normally)
*   Comprehensive data provision

### Rectification Requests
*   Prompt correction of inaccurate data
*   Notification to third parties
*   Verification procedures
*   Update confirmation

### Erasure Requests
*   Assessment of deletion rights
*   Technical deletion procedures
*   Third-party notification
*   Retention requirement checks

### Portability Requests
*   Machine-readable format
*   Secure transfer methods
*   Direct transfer where possible
*   Data completeness verification

## 10. Marketing and Communications
### Consent Management
*   Clear opt-in procedures
*   Granular consent options
*   Easy opt-out mechanisms
*   Consent record keeping

### Communication Preferences
*   Channel preferences
*   Frequency controls
*   Content personalisation
*   Unsubscribe handling

### Third-Party Marketing
*   Separate consent required
*   Clear disclosure of sharing
*   Opt-out provisions
*   Partner vetting procedures

## 11. Data Quality Management
### Accuracy Measures
*   Regular data validation
*   Customer update prompts
*   Automated quality checks
*   Error correction procedures

### Data Completeness
*   Mandatory field requirements
*   Progressive profiling
*   Data enrichment services
*   Gap analysis procedures

### Currency Management
*   Regular data refresh
*   Expiry date tracking
*   Revalidation procedures
*   Obsolete data removal

## 12. Incident Response
### Data Breach Procedures
*   Immediate containment
*   Risk assessment
*   Authority notification
*   Customer communication

### Investigation Process
*   Forensic analysis
*   Root cause identification
*   Impact assessment
*   Remediation planning

### Communication Management
*   Internal escalation
*   Customer notification
*   Media management
*   Stakeholder updates

## 13. Staff Training and Compliance
### Training Requirements
*   Role-specific training
*   Regular refresher sessions
*   New starter orientation
*   Specialised data handling training

### Compliance Monitoring
*   Regular audits
*   Process reviews
*   Compliance metrics
*   Corrective action plans

### Performance Management
*   Data handling KPIs
*   Incident tracking
*   Training completion rates
*   Customer satisfaction scores

## 14. Vendor and Partner Management
### Due Diligence
*   Security assessments
*   Compliance verification
*   Contract review
*   Ongoing monitoring

### Service Level Agreements
*   Data handling requirements
*   Security standards
*   Incident response procedures
*   Performance metrics

## 15. Continuous Improvement
### Regular Reviews
*   Policy updates
*   Process improvements
*   Technology upgrades
*   Regulatory compliance

### Best Practice Adoption
*   Industry standard benchmarking
*   Technology innovation
*   Staff feedback incorporation
*   Customer feedback integration
`,
  },
  {
    id: 'dp-005',
    title: 'Incident Response & Breach Notification Policy',
    description:
      'Procedures for detecting, responding to, and reporting data security incidents and personal data breaches.',
    category: 'Data Protection & Privacy',
    type: 'required',
    estimatedTime: 30,
    content: `
# Incident Response & Breach Notification Policy

## 1. Purpose
This policy establishes procedures for detecting, responding to, and reporting security incidents and personal data breaches in accordance with UK GDPR requirements.

## 2. Definitions
### Security Incident
Any event that could potentially compromise the confidentiality, integrity, or availability of information systems or data.

### Personal Data Breach
A breach of security leading to accidental or unlawful destruction, loss, alteration, unauthorised disclosure of, or access to personal data.

### Data Controller vs Processor
*   Controller: Determines purposes and means of processing
*   Processor: Processes data on behalf of controller

## 3. Incident Classification
### Category 1 - Critical
*   Widespread system compromise
*   Large-scale personal data breach
*   Ransomware or malware infection
*   Significant service disruption

### Category 2 - High
*   Limited system compromise
*   Personal data breach affecting multiple individuals
*   Unauthorised access to sensitive data
*   Significant but contained incidents

### Category 3 - Medium
*   Individual account compromise
*   Small-scale data exposure
*   System vulnerability exploitation
*   Privacy incidents with limited impact

### Category 4 - Low
*   Failed login attempts
*   Minor system irregularities
*   Potential but unconfirmed incidents
*   Routine security events

## 4. Incident Response Team
### Core Team Members
*   **Incident Commander**: Overall response coordination
*   **IT Security Lead**: Technical investigation and remediation
*   **Data Protection Officer**: Privacy impact assessment
*   **Legal Counsel**: Legal implications and requirements
*   **Communications Lead**: Internal and external communications

### Extended Team
*   Senior management
*   HR representative
*   Customer service manager
*   External specialists (as needed)

## 5. Detection and Reporting
### Detection Methods
*   Automated security monitoring
*   Staff reporting
*   Customer complaints
*   Third-party notifications
*   External security alerts

### Internal Reporting
*   Immediate notification to incident commander
*   24/7 incident reporting hotline
*   Email reporting system
*   Escalation procedures
*   No-blame reporting culture

### Documentation Requirements
*   Date and time of incident
*   How incident was discovered
*   Systems and data affected
*   Initial assessment of impact
*   Actions taken immediately

## 6. Initial Response (0-1 Hours)
### Immediate Actions
1.  **Contain the incident** - prevent further damage
2.  **Assess the situation** - understand scope and impact
3.  **Activate response team** - notify key personnel
4.  **Preserve evidence** - maintain forensic integrity
5.  **Document everything** - maintain detailed logs

### Containment Measures
*   Isolate affected systems
*   Revoke compromised credentials
*   Block suspicious network traffic
*   Preserve system images
*   Prevent data destruction

### Initial Assessment
*   Number of individuals affected
*   Types of personal data involved
*   Likelihood of unauthorised access
*   Potential consequences for individuals
*   Risk of ongoing compromise

## 7. Investigation Phase (1-24 Hours)
### Forensic Investigation
*   Detailed system analysis
*   Log file examination
*   Network traffic analysis
*   Malware analysis
*   Evidence collection

### Impact Assessment
*   Full scope determination
*   Data types affected
*   Individual risk assessment
*   Business impact analysis
*   Regulatory implications

### Root Cause Analysis
*   How the incident occurred
*   System vulnerabilities exploited
*   Process failures identified
*   Human factors involved
*   Timeline reconstruction

## 8. Notification Requirements
### ICO Notification (72 Hours)
Required when breach is likely to result in risk to rights and freedoms:
*   Nature of the breach
*   Categories and number of individuals affected
*   Likely consequences
*   Measures taken or proposed

### Individual Notification (Without Undue Delay)
Required when breach likely to result in high risk:
*   Clear and plain language
*   Nature of the breach
*   Contact details of DPO
*   Likely consequences
*   Measures taken

### Internal Notifications
*   Senior management briefing
*   Board notification (if serious)
*   Insurance company notification
*   Legal team involvement

## 9. Communication Management
### Internal Communications
*   Staff briefings and updates
*   Management reporting
*   Board notifications
*   Stakeholder updates

### External Communications
*   Customer notifications
*   Partner/supplier alerts
*   Media statements (if required)
*   Regulatory correspondence

### Communication Principles
*   Accuracy and transparency
*   Timely information sharing
*   Consistent messaging
*   Empathy and responsibility

## 10. Recovery and Restoration
### System Recovery
*   Vulnerability remediation
*   System patching and updates
*   Security control improvements
*   Monitoring enhancement

### Business Continuity
*   Service restoration priorities
*   Alternative processing arrangements
*   Customer impact mitigation
*   Stakeholder communication

### Evidence Preservation
*   Forensic image retention
*   Log file preservation
*   Documentation maintenance
*   Legal hold requirements

## 11. Post-Incident Activities
### Lessons Learned Review
*   Incident timeline analysis
*   Response effectiveness evaluation
*   Process improvement identification
*   Training need assessment

### Documentation Updates
*   Incident report completion
*   Process refinements
*   Control improvements
*   Training material updates

### Monitoring Enhancement
*   Additional security measures
*   Improved detection capabilities
*   Enhanced monitoring procedures
*   Regular testing protocols

## 12. Specific Breach Types
### Cyber Attacks
*   Malware/ransomware response
*   Phishing incident handling
*   DDoS attack mitigation
*   Insider threat management

### Human Error
*   Misdirected emails
*   Incorrect data sharing
*   Lost devices
*   Weak password incidents

### System Failures
*   Database corruption
*   Backup failures
*   Cloud service outages
*   Network security failures

## 13. Legal and Regulatory
### Compliance Requirements
*   UK GDPR obligations
*   Data Protection Act 2018
*   Sector-specific regulations
*   Contractual obligations

### Legal Considerations
*   Privilege protection
*   Litigation holds
*   Regulatory cooperation
*   Insurance claims

### Documentation Requirements
*   Breach register maintenance
*   Evidence collection
*   Decision rationale
*   Compliance demonstration

## 14. Training and Preparedness
### Staff Training
*   Incident recognition
*   Reporting procedures
*   Response protocols
*   Regular awareness sessions

### Simulation Exercises
*   Tabletop exercises
*   Technical simulations
*   Cross-functional drills
*   Third-party testing

### Preparedness Measures
*   Response plan testing
*   Contact list maintenance
*   Tool and system readiness
*   Vendor relationship management

## 15. Continuous Improvement
*   Regular plan reviews
*   Incident trend analysis
*   Best practice adoption
*   Technology updates
*   Regulatory change monitoring
`,
  },
  {
    id: 'dp-006',
    title: 'Open Source Software Usage Policy',
    description:
      'Guidelines for evaluating, using, and managing open source software components while managing legal and security risks.',
    category: 'Data Protection & Privacy',
    type: 'recommended',
    estimatedTime: 22,
    content: `
# Open Source Software Usage Policy

## 1. Purpose
This policy establishes guidelines for the evaluation, approval, and use of open source software (OSS) to manage legal, security, and operational risks while enabling innovation.

## 2. Scope
This policy applies to:
*   All open source software components
*   Third-party libraries and frameworks
*   Development tools and utilities
*   Infrastructure and deployment software

## 3. Open Source Software Categories
### Approved OSS
*   Pre-approved for general use
*   Standard business applications
*   Common development tools
*   Well-established frameworks

### Restricted OSS
*   Requires approval before use
*   Copyleft licences
*   Security-sensitive components
*   Novel or unproven software

### Prohibited OSS
*   Incompatible licence terms
*   Known security vulnerabilities
*   Insufficient maintenance
*   Legal or compliance conflicts

## 4. Licence Management
### Acceptable Licences
*   MIT Licence
*   Apache Licence 2.0
*   BSD Licences (2 and 3-clause)
*   ISC Licence
*   Unlicence

### Restricted Licences (Approval Required)
*   GNU GPL (all versions)
*   GNU LGPL
*   Mozilla Public Licence (MPL)
*   Eclipse Public Licence (EPL)

### Prohibited Licences
*   Licences incompatible with commercial use
*   Viral licences with broad requirements
*   Licences requiring source disclosure
*   Custom licences without legal review

### Licence Compliance
*   Maintain licence inventory
*   Include required attributions
*   Comply with distribution requirements
*   Monitor licence changes

## 5. Security Assessment
### Vulnerability Management
*   Regular vulnerability scanning
*   Dependency checking tools
*   Security advisory monitoring
*   Patch management procedures

### Security Criteria
*   Active maintenance and updates
*   Responsive security disclosure
*   Community security practices
*   Known vulnerability history

### Risk Assessment
*   Exposure to sensitive data
*   Network communication requirements
*   Privilege escalation risks
*   Supply chain considerations

## 6. Evaluation Process
### Technical Assessment
*   Code quality review
*   Performance benchmarking
*   Compatibility testing
*   Documentation quality

### Community Assessment
*   Project maturity and stability
*   Development community size
*   Maintenance frequency
*   Long-term viability

### Business Assessment
*   Strategic alignment
*   Cost-benefit analysis
*   Support availability
*   Vendor alternatives

## 7. Approval Process
### Self-Service Approval
*   Pre-approved OSS list
*   Automated compliance checking
*   Standard business tools
*   Low-risk components

### Manager Approval
*   Development libraries
*   Infrastructure components
*   Medium-risk assessments
*   Budget implications

### Legal/Security Review
*   Copyleft licences
*   Security-sensitive components
*   Custom licence terms
*   High-risk assessments

### Documentation Requirements
*   Business justification
*   Security assessment
*   Licence compliance plan
*   Alternative evaluation

## 8. Implementation Guidelines
### Development Usage
*   Use package managers where possible
*   Pin specific versions
*   Maintain dependency documentation
*   Regular update procedures

### Production Deployment
*   Security scanning before deployment
*   Licence verification
*   Performance monitoring
*   Rollback procedures

### Container and Cloud
*   Base image scanning
*   Runtime security monitoring
*   Cloud service integration
*   Compliance documentation

## 9. Inventory Management
### Software Inventory
*   Central registry of OSS components
*   Version tracking
*   Licence documentation
*   Usage locations

### Automated Discovery
*   Code repository scanning
*   Build system integration
*   Runtime detection
*   Cloud resource monitoring

### Regular Audits
*   Quarterly inventory reviews
*   Licence compliance checks
*   Security vulnerability assessments
*   Usage pattern analysis

## 10. Contribution Guidelines
### Contributing to OSS Projects
*   Legal review required
*   IP ownership verification
*   Contribution agreement review
*   Business value assessment

### Creating OSS Projects
*   Business case required
*   Licence selection approval
*   Maintenance commitment
*   Resource allocation

### Employee Contributions
*   Clear policy on personal contributions
*   Potential conflicts of interest
*   IP ownership clarification
*   Time and resource boundaries

## 11. Compliance Monitoring
### Automated Monitoring
*   Licence scanning tools
*   Vulnerability detection
*   Policy compliance checking
*   Alerting and reporting

### Manual Reviews
*   Periodic compliance audits
*   New project assessments
*   Risk reassessments
*   Legal requirement updates

### Remediation Procedures
*   Non-compliance identification
*   Risk mitigation strategies
*   Replacement planning
*   Timeline management

## 12. Training and Support
### Developer Training
*   OSS policy awareness
*   Licence understanding
*   Security best practices
*   Tool usage training

### Management Training
*   Business risk awareness
*   Approval processes
*   Strategic considerations
*   Cost implications

### Legal Training
*   Licence interpretation
*   Compliance requirements
*   Risk assessment
*   Contract implications

## 13. Incident Response
### Security Incidents
*   Vulnerability disclosure response
*   Patch deployment procedures
*   Risk communication
*   Alternative planning

### Compliance Issues
*   Licence violation response
*   Legal consultation
*   Remediation planning
*   Stakeholder communication

### Vendor Issues
*   Project abandonment
*   Maintenance transfer
*   Alternative identification
*   Migration planning

## 14. Documentation Requirements
### Project Documentation
*   OSS component lists
*   Licence summaries
*   Security assessments
*   Approval records

### Legal Documentation
*   Licence compliance evidence
*   Attribution requirements
*   Distribution obligations
*   Contract terms

### Technical Documentation
*   Integration guides
*   Configuration requirements
*   Security procedures
*   Update processes

## 15. Review and Updates
*   Annual policy review
*   Technology trend monitoring
*   Legal requirement changes
*   Industry best practice adoption
*   Tool and process improvements
`,
  },
  {
    id: 'dp-007',
    title: 'AI & Data Ethics Policy',
    description:
      'Ethical framework for AI development and use, ensuring responsible data practices and algorithmic fairness.',
    category: 'Data Protection & Privacy',
    type: 'recommended',
    estimatedTime: 35,
    content: `
# AI & Data Ethics Policy

## 1. Purpose
This policy establishes ethical principles and guidelines for the responsible development, deployment, and use of artificial intelligence and automated decision-making systems at [Your Company Name].

## 2. Core Ethical Principles
### Fairness and Non-Discrimination
*   Prevent algorithmic bias and discrimination
*   Ensure equal treatment across all groups
*   Regular bias testing and mitigation
*   Inclusive design practices

### Transparency and Explainability
*   Clear communication about AI use
*   Understandable decision-making processes
*   Right to explanation for automated decisions
*   Open about limitations and uncertainties

### Privacy and Data Protection
*   Minimise data collection and use
*   Strong consent mechanisms
*   Purpose limitation and data minimisation
*   Enhanced security for AI systems

### Human Agency and Oversight
*   Meaningful human control over AI systems
*   Right to human review of decisions
*   Clear escalation procedures
*   Human-in-the-loop approaches

### Safety and Reliability
*   Robust testing and validation
*   Fail-safe mechanisms
*   Continuous monitoring
*   Risk assessment and mitigation

## 3. Scope of Application
### AI Systems Covered
*   Machine learning algorithms
*   Automated decision-making systems
*   Natural language processing tools
*   Computer vision applications
*   Predictive analytics systems

### Use Cases
*   Customer service and support
*   Recruitment and HR processes
*   Marketing and personalisation
*   Risk assessment and fraud detection
*   Product recommendations

## 4. Data Governance for AI
### Data Quality Requirements
*   Accurate and representative datasets
*   Regular data quality assessments
*   Bias detection in training data
*   Data lineage and provenance tracking

### Data Collection Ethics
*   Clear consent for AI-specific uses
*   Transparent data collection notices
*   Minimal and necessary data collection
*   Special protection for sensitive data

### Training Data Management
*   Ethical sourcing of training data
*   Intellectual property compliance
*   Regular dataset updates and validation
*   Secure storage and access controls

## 5. Algorithm Development
### Design Principles
*   Inclusive design from the start
*   Multiple perspectives in development teams
*   Regular stakeholder consultation
*   Iterative improvement processes

### Testing and Validation
*   Comprehensive testing protocols
*   Bias and fairness testing
*   Performance across different groups
*   Edge case and failure mode analysis

### Documentation Requirements
*   Algorithm design documentation
*   Training data descriptions
*   Performance metrics and limitations
*   Risk assessments and mitigation plans

## 6. Deployment and Monitoring
### Pre-Deployment Checks
*   Ethics review and approval
*   Legal compliance verification
*   Technical validation
*   Stakeholder impact assessment

### Ongoing Monitoring
*   Continuous performance monitoring
*   Bias detection and measurement
*   User feedback collection
*   Regular model retraining

### Performance Metrics
*   Accuracy across different groups
*   Fairness and bias indicators
*   User satisfaction measures
*   Business impact assessment

## 7. Automated Decision Making
### High-Risk Decisions
*   Employment and recruitment
*   Financial services and credit
*   Healthcare and medical
*   Legal and law enforcement

### Decision Transparency
*   Clear notification of automated decisions
*   Explanation of decision factors
*   Contact for human review
*   Appeals and correction processes

### Human Oversight Requirements
*   Qualified human reviewers
*   Regular review sampling
*   Override capabilities
*   Escalation procedures

## 8. Bias Prevention and Mitigation
### Bias Assessment
*   Regular algorithmic auditing
*   Fairness metrics evaluation
*   Impact assessment across groups
*   Historical bias analysis

### Mitigation Strategies
*   Diverse training datasets
*   Bias detection algorithms
*   Fairness constraints in models
*   Regular rebalancing and updates

### Testing Procedures
*   Pre-deployment bias testing
*   Ongoing monitoring protocols
*   Comparative analysis across groups
*   Red team assessments

## 9. Privacy-Preserving AI
### Privacy-by-Design
*   Data minimisation principles
*   Purpose limitation enforcement
*   Privacy impact assessments
*   Technical privacy measures

### Technical Safeguards
*   Differential privacy techniques
*   Federated learning approaches
*   Homomorphic encryption
*   Secure multiparty computation

### Data Subject Rights
*   Right to explanation
*   Right to object to automated decisions
*   Data portability for AI systems
*   Erasure and correction rights

## 10. Third-Party AI Services
### Vendor Assessment
*   Ethics and bias evaluation
*   Transparency requirements
*   Data handling practices
*   Audit rights and procedures

### Contract Requirements
*   Ethical AI clauses
*   Transparency obligations
*   Bias monitoring requirements
*   Audit and compliance terms

### Integration Standards
*   API transparency requirements
*   Data flow documentation
*   Performance monitoring
*   Fallback procedures

## 11. Stakeholder Engagement
### Internal Stakeholders
*   Employee consultation
*   Customer advisory groups
*   Ethics review boards
*   Technical expert panels

### External Engagement
*   Community representatives
*   Academic researchers
*   Civil society organisations
*   Regulatory bodies

### Feedback Mechanisms
*   Regular consultation sessions
*   Anonymous feedback channels
*   Impact assessment surveys
*   Continuous dialogue processes

## 12. Training and Awareness
### Staff Training
*   AI ethics fundamentals
*   Bias recognition and mitigation
*   Technical implementation
*   Legal and regulatory requirements

### Leadership Training
*   Strategic AI governance
*   Risk management
*   Stakeholder engagement
*   Ethical decision making

### Ongoing Education
*   Regular training updates
*   Best practice sharing
*   Case study analysis
*   Industry benchmarking

## 13. Governance Structure
### AI Ethics Committee
*   Cross-functional representation
*   External expert advisors
*   Regular review meetings
*   Decision-making authority

### Roles and Responsibilities
*   Data scientists and engineers
*   Product managers
*   Legal and compliance teams
*   Senior management oversight

### Escalation Procedures
*   Ethics concern reporting
*   Review and assessment processes
*   Decision appeals procedures
*   External consultation options

## 14. Compliance and Auditing
### Regular Audits
*   Annual ethics reviews
*   Technical performance audits
*   Bias and fairness assessments
*   Stakeholder impact evaluations

### Documentation Requirements
*   AI system registers
*   Decision logs and rationales
*   Performance and bias metrics
*   Incident reports and responses

### Regulatory Compliance
*   UK GDPR requirements
*   Equality Act obligations
*   Sector-specific regulations
*   International standards alignment

## 15. Incident Response
### Ethics Incidents
*   Bias or discrimination reports
*   Privacy violations
*   Unfair decision outcomes
*   System failures or errors

### Response Procedures
*   Immediate assessment and containment
*   Stakeholder notification
*   Remediation and correction
*   Process improvement implementation

### Learning and Improvement
*   Incident analysis and documentation
*   Process refinement
*   Training updates
*   Best practice sharing

## 16. Future Considerations
*   Emerging AI technologies
*   Regulatory developments
*   Societal impact considerations
*   International cooperation
*   Continuous policy evolution
`,
  },
];