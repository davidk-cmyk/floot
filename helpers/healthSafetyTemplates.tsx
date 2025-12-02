import { PolicyTemplate } from './policyTemplateModel';

export const HEALTH_SAFETY_TEMPLATES: PolicyTemplate[] = [
  {
    id: 'hs-001',
    title: 'Health and Safety Policy',
    description:
      'A legal requirement for businesses with 5 or more employees. Details your commitment to providing a safe workplace.',
    category: 'Health & Safety',
    type: 'required',
    estimatedTime: 25,
    content: `
# Health and Safety Policy

## 1. Statement of Intent
[Your Company Name] is committed to ensuring the health, safety, and welfare of our employees and anyone else affected by our business activities. We will provide and maintain a safe and healthy working environment in accordance with the Health and Safety at Work etc. Act 1974 and associated regulations.

## 2. Overall Responsibilities
### Board of Directors/Senior Management
*   Overall accountability for health and safety
*   Ensure adequate resources for health and safety
*   Review and approve health and safety policy
*   Monitor health and safety performance

### Managing Director/CEO: [Name]
*   Overall responsibility for health and safety implementation
*   Ensure policy communication to all employees
*   Regular review of health and safety performance
*   Approval of significant health and safety expenditure

### Health and Safety Manager: [Name/Position]
*   Day-to-day implementation of health and safety policy
*   Conduct risk assessments and safety audits
*   Provide health and safety training
*   Investigate accidents and incidents
*   Maintain health and safety records

### Line Managers
*   Implement health and safety in their areas
*   Conduct local risk assessments
*   Ensure staff training and supervision
*   Report hazards and incidents
*   Maintain safe working environment

### All Employees
*   Take reasonable care of their own health and safety
*   Take care not to endanger others
*   Cooperate with management on health and safety
*   Use safety equipment provided
*   Report hazards, incidents and near misses

## 3. Risk Assessment and Management
### Risk Assessment Process
*   Systematic identification of hazards
*   Assessment of risks to employees and others
*   Implementation of control measures
*   Regular review and update of assessments
*   Documentation of significant findings

### Hazard Categories
*   Physical hazards (noise, vibration, radiation)
*   Chemical hazards (substances, fumes, dusts)
*   Biological hazards (bacteria, viruses)
*   Ergonomic hazards (manual handling, workstation design)
*   Psychosocial hazards (stress, violence, harassment)

### Control Hierarchy
1.  Elimination of hazards where possible
2.  Substitution with safer alternatives
3.  Engineering controls and barriers
4.  Administrative controls and procedures
5.  Personal protective equipment (PPE)

## 4. Workplace Safety Arrangements
### Office Safety
*   Safe workstation setup and DSE compliance
*   Adequate lighting and ventilation
*   Safe storage and housekeeping
*   Electrical safety and PAT testing
*   Slip, trip and fall prevention

### Fire Safety
*   Fire risk assessment and emergency procedures
*   Fire detection and alarm systems
*   Emergency lighting and exit routes
*   Fire extinguishers and maintenance
*   Regular fire drills and training

### First Aid
*   Adequate first aid provisions based on risk assessment
*   Trained first aiders and appointed persons
*   First aid equipment and facilities
*   Accident recording and reporting
*   Emergency contact information

## 5. Occupational Health
### Health Surveillance
*   Pre-employment health screening where appropriate
*   Regular health checks for at-risk workers
*   Management of work-related ill health
*   Return to work assessments
*   Occupational health referrals

### Stress and Mental Health
*   Stress risk assessment and management
*   Mental health awareness and support
*   Work-life balance promotion
*   Employee assistance programmes
*   Management training on mental health

### Display Screen Equipment (DSE)
*   DSE assessments for all users
*   Ergonomic workstation setup
*   Eye test provision and support
*   Training on safe DSE use
*   Regular review of assessments

## 6. Training and Information
### Induction Training
*   Health and safety orientation for all new employees
*   Site-specific hazards and controls
*   Emergency procedures
*   Reporting requirements

### Ongoing Training
*   Regular refresher training
*   Job-specific safety training
*   New equipment or process training
*   Management development programmes

### Information Provision
*   Health and safety notices and communications
*   Safety data sheets and instructions
*   Policy and procedure documents
*   Regular safety bulletins

## 7. Incident Management
### Accident and Incident Reporting
*   Immediate reporting of all accidents and incidents
*   Investigation procedures and timescales
*   Root cause analysis and corrective actions
*   RIDDOR reporting where applicable
*   Learning from incidents

### Near Miss Reporting
*   Encourage reporting of near misses
*   Investigation and analysis procedures
*   Prevention of future incidents
*   Recognition of good reporting

### Emergency Procedures
*   Clear evacuation procedures
*   Emergency contact numbers
*   Coordination with emergency services
*   Business continuity considerations

## 8. Monitoring and Review
### Performance Monitoring
*   Regular safety inspections and audits
*   Accident and incident analysis
*   Health and safety KPIs
*   Benchmarking against industry standards

### Policy Review
*   Annual policy review
*   Review following significant incidents
*   Changes to legislation or regulations
*   Changes to business activities

### Employee Consultation
*   Health and safety committee meetings
*   Employee surveys and feedback
*   Safety suggestion schemes
*   Regular communication sessions

## 9. Contractors and Visitors
### Contractor Management
*   Pre-qualification and vetting
*   Health and safety requirements in contracts
*   Induction and supervision
*   Monitoring and audit procedures

### Visitor Safety
*   Visitor registration and induction
*   Escort requirements
*   PPE provision where necessary
*   Emergency procedures communication

## 10. Special Considerations
### Lone Working
*   Risk assessment for lone workers
*   Communication and check-in procedures
*   Emergency response arrangements
*   Training and support provision

### Working Time
*   Compliance with working time regulations
*   Rest break and holiday provision
*   Fatigue risk management
*   Shift work considerations

### Young Workers and New Mothers
*   Specific risk assessments
*   Additional protection measures
*   Training and supervision requirements
*   Regular review of arrangements

## 11. Legal Compliance
### Regulatory Requirements
*   Health and Safety at Work etc. Act 1974
*   Management of Health and Safety at Work Regulations 1999
*   Workplace (Health, Safety and Welfare) Regulations 1992
*   Display Screen Equipment Regulations 1992
*   Manual Handling Operations Regulations 1992

### Record Keeping
*   Accident and incident records
*   Risk assessments and reviews
*   Training records
*   Health surveillance records
*   Equipment maintenance records

## 12. Resources and Support
*   Adequate budget allocation for health and safety
*   External health and safety consultancy support
*   Professional memberships and networks
*   Regular updates on legal requirements
*   Investment in safety equipment and technology

This policy will be reviewed annually or following significant changes to our business operations.

**Signed:** [Managing Director Name]
**Date:** [Date]
**Next Review:** [Date]
`,
  },
  {
    id: 'hs-002',
    title: 'Display Screen Equipment (DSE) Assessment Policy',
    description:
      'Comprehensive guidance for assessing and managing risks associated with computer workstations and display screen equipment.',
    category: 'Health & Safety',
    type: 'required',
    estimatedTime: 20,
    content: `
# Display Screen Equipment (DSE) Assessment Policy

## 1. Purpose
This policy ensures compliance with the Health and Safety (Display Screen Equipment) Regulations 1992 and protects employees from risks associated with DSE use.

## 2. Scope
This policy applies to:
*   All employees using DSE for continuous periods
*   Workstations and display screen equipment
*   Home working and remote DSE use
*   Mobile and temporary DSE usage

## 3. User Categories
### DSE Users
Employees who:
*   Use DSE for continuous spells of an hour or more
*   Use DSE daily for significant periods
*   Rely on DSE to do their job effectively
*   Have little choice over DSE use

### Occasional Users
Employees who use DSE:
*   Infrequently or for short periods
*   With regular breaks and alternative tasks
*   By choice rather than necessity

## 4. DSE Assessment Requirements
### Initial Assessment
*   All DSE users must receive an assessment
*   Assessment within 30 days of starting DSE work
*   Completed by trained assessor
*   Results documented and acted upon

### Review Requirements
*   Annual review of all assessments
*   Review following changes to workstation
*   Review after reporting discomfort or problems
*   Review following significant organisational changes

### Self-Assessment Option
*   Trained users may conduct self-assessments
*   Using approved assessment forms
*   With management oversight and support
*   Professional assessment for complex cases

## 5. Assessment Checklist
### Display Screen
*   Screen size appropriate for tasks
*   Characters clear and readable
*   Image stable without flicker
*   Brightness and contrast adjustable
*   Screen position adjustable
*   Free from glare and reflections

### Keyboard and Input Devices
*   Keyboard separate from screen
*   Keys clearly marked and comfortable
*   Adequate space in front of keyboard
*   Mouse or trackball suitable for tasks
*   Alternative input devices where needed

### Seating and Posture
*   Adjustable chair height
*   Backrest height and tilt adjustable
*   Stable five-castor base
*   Armrests available if required
*   Footrest provided if needed

### Desk and Work Surface
*   Adequate size for equipment and tasks
*   Sufficient legroom and clearance
*   Stable and at appropriate height
*   Non-reflective surface
*   Adequate storage space

### Environment
*   Adequate lighting without glare
*   Noise levels appropriate for tasks
*   Temperature and humidity comfortable
*   Adequate space and ventilation
*   Minimum distraction from others

## 6. Health Considerations
### Eye and Eyesight
*   Eye and eyesight tests available
*   Special corrective appliances if required
*   Regular breaks to rest eyes
*   Awareness of symptoms to report

### Musculoskeletal Issues
*   Upper limb disorders prevention
*   Back pain and posture problems
*   Neck and shoulder strain
*   Repetitive strain injury (RSI)

### Mental Health and Wellbeing
*   Stress from intensive DSE work
*   Fatigue and concentration problems
*   Work-life balance considerations
*   Social interaction and isolation

## 7. Risk Control Measures
### Ergonomic Solutions
*   Adjustable furniture and equipment
*   Document holders and copy stands
*   Wrist rests and ergonomic accessories
*   Lighting adjustments and task lighting

### Work Organisation
*   Regular breaks from DSE work
*   Variety in daily activities
*   Appropriate workload management
*   Flexibility in work arrangements

### Training and Information
*   DSE awareness training
*   Workstation adjustment training
*   Health risk awareness
*   Reporting procedure information

## 8. Eye and Eyesight Testing
### Entitlement
*   Free eye tests for DSE users
*   Tests before starting DSE work
*   Regular tests thereafter
*   Tests when experiencing visual difficulties

### Arrangements
*   Approved optometrist or doctor
*   Reasonable time off for tests
*   Reimbursement of reasonable costs
*   Provision of special spectacles if needed

### Special Corrective Appliances
*   Spectacles specifically for DSE work
*   Cost met by employer
*   Replacement when necessary
*   Not required to pay for general spectacles

## 9. Home Working and Remote DSE
### Assessment Requirements
*   Same standards apply to home working
*   Self-assessment tools provided
*   Photograph evidence may be required
*   Site visits for complex assessments

### Equipment Provision
*   Suitable DSE equipment provided
*   Ergonomic furniture support
*   Technical support and maintenance
*   Safe installation guidance

### Health and Safety Responsibility
*   Employer duty of care continues
*   Employee cooperation required
*   Regular review and monitoring
*   Incident reporting procedures

## 10. Training Requirements
### User Training
*   Workstation setup and adjustment
*   Health risks and prevention
*   Break patterns and exercises
*   Reporting procedures

### Assessor Training
*   DSE regulations and requirements
*   Assessment techniques
*   Risk identification
*   Control measure selection

### Manager Training
*   Legal obligations
*   Assessment oversight
*   Resource allocation
*   Performance monitoring

## 11. Record Keeping
### Assessment Records
*   Individual assessment forms
*   Action plans and completion dates
*   Review dates and outcomes
*   Equipment provision records

### Health Records
*   Eye test arrangements and results
*   Health surveillance data
*   Incident and problem reports
*   Reasonable adjustments made

## 12. Procurement Standards
### Equipment Selection
*   Ergonomic design criteria
*   User needs assessment
*   Adjustability requirements
*   Quality and durability standards

### Supplier Requirements
*   Compliance with relevant standards
*   User guides and instructions
*   Training and support provision
*   Warranty and maintenance terms

## 13. Reasonable Adjustments
### Disability Considerations
*   Individual needs assessment
*   Assistive technology provision
*   Environmental modifications
*   Work pattern adjustments

### Temporary Adjustments
*   Pregnancy-related changes
*   Injury or illness adaptations
*   Age-related considerations
*   Temporary impairments

## 14. Monitoring and Review
### Performance Indicators
*   Assessment completion rates
*   User satisfaction surveys
*   Health problem reports
*   Equipment utilisation

### Continuous Improvement
*   Regular policy review
*   Best practice adoption
*   Technology updates
*   User feedback incorporation

## 15. Emergency Procedures
*   Immediate response to DSE-related injuries
*   First aid arrangements
*   Reporting and investigation procedures
*   Return to work considerations
*   Prevention of recurrence
`,
  },
];