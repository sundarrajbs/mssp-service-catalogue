import type { Service } from "@/lib/domain/types";

/**
 * Generic, vendor-neutral starter library. Unit costs are indicative monthly
 * figures in INR and are meant to be edited during the workshop.
 * IDs are stable so default tiers can reference them.
 */
export const SEED_SERVICES: Service[] = [
  {
    id: "svc-security-monitoring",
    name: "24x7 Security Monitoring",
    category: "Detection & Response",
    description:
      "Round-the-clock monitoring of security telemetry from endpoints, network, cloud and identity sources by a staffed Security Operations Centre. Alerts are triaged, enriched and escalated according to agreed severity definitions.",
    deliverables: [
      "Continuous log collection, correlation and alert triage",
      "Escalation of validated incidents within SLA",
      "Tuned detection use-case library mapped to MITRE ATT&CK",
      "Monthly service report with alert trends and tuning actions",
    ],
    prerequisites: [
      "Log sources onboarded to the central log platform",
      "Named escalation contacts and out-of-hours numbers",
      "Asset inventory with business criticality",
    ],
    nistFunctions: ["Detect"],
    pricingUnit: "gbDay",
    unitCost: 150,
    isAddOn: false,
  },
  {
    id: "svc-mdr",
    name: "Managed Detection & Response",
    category: "Detection & Response",
    description:
      "Endpoint-centric detection and response in which analysts investigate suspicious activity and take approved containment actions, such as isolating a host or killing a process, on the customer's behalf.",
    deliverables: [
      "Deployment and health monitoring of endpoint sensors",
      "Analyst-led investigation of endpoint detections",
      "Remote containment actions under pre-approved runbooks",
      "Incident summary with root cause and remediation steps",
    ],
    prerequisites: [
      "Endpoint detection agent deployed to in-scope devices",
      "Signed containment authorisation matrix",
    ],
    nistFunctions: ["Detect", "Respond"],
    pricingUnit: "endpoint",
    unitCost: 650,
    isAddOn: false,
  },
  {
    id: "svc-threat-hunting",
    name: "Proactive Threat Hunting",
    category: "Detection & Response",
    description:
      "Hypothesis-driven hunts across historical telemetry to find threats that evaded automated detection. Findings are converted into new detection rules so the same technique is caught next time.",
    deliverables: [
      "Monthly hunt campaigns based on current threat activity",
      "Hunt report with findings, evidence and risk rating",
      "New or improved detection rules from each hunt",
    ],
    prerequisites: [
      "Minimum 30 days of searchable telemetry retention",
      "Security Monitoring or MDR service in place",
    ],
    nistFunctions: ["Detect", "Identify"],
    pricingUnit: "endpoint",
    unitCost: 250,
    isAddOn: false,
  },
  {
    id: "svc-ir-retainer",
    name: "Incident Response Retainer",
    category: "Incident Response",
    description:
      "Guaranteed access to an experienced incident response team with pre-agreed terms, so a major incident can be handled immediately without procurement delays.",
    deliverables: [
      "Guaranteed remote response within agreed hours of activation",
      "Pre-negotiated block of response hours per year",
      "Annual incident response plan review",
      "Post-incident report with lessons learned",
    ],
    prerequisites: [
      "Completed onboarding questionnaire and contact tree",
      "Approved legal and communication escalation paths",
    ],
    nistFunctions: ["Respond", "Recover"],
    pricingUnit: "flatMonthly",
    unitCost: 150000,
    isAddOn: false,
  },
  {
    id: "svc-forensics",
    name: "Digital Forensics",
    category: "Incident Response",
    description:
      "Evidence acquisition and forensic analysis of endpoints, servers, cloud workloads and mobile devices, with chain-of-custody handling suitable for legal, regulatory or insurance purposes.",
    deliverables: [
      "Forensically sound evidence collection and preservation",
      "Timeline reconstruction and attacker activity analysis",
      "Expert forensic report suitable for legal use",
    ],
    prerequisites: [
      "Authorisation to access affected systems",
      "Legal counsel engaged where litigation is likely",
    ],
    nistFunctions: ["Respond"],
    pricingUnit: "flatMonthly",
    unitCost: 75000,
    isAddOn: true,
  },
  {
    id: "svc-vulnerability-management",
    name: "Vulnerability Management",
    category: "Exposure Management",
    description:
      "Scheduled authenticated scanning of infrastructure and applications, with risk-based prioritisation that considers exploitability and asset criticality, not just severity scores.",
    deliverables: [
      "Monthly authenticated vulnerability scans",
      "Risk-prioritised remediation plan",
      "Remediation verification rescans",
      "Trend dashboard of exposure and time-to-remediate",
    ],
    prerequisites: [
      "Scanning credentials for in-scope systems",
      "Agreed scanning windows and exclusions",
    ],
    nistFunctions: ["Identify", "Protect"],
    pricingUnit: "endpoint",
    unitCost: 120,
    isAddOn: false,
  },
  {
    id: "svc-attack-surface",
    name: "Attack Surface Monitoring",
    category: "Exposure Management",
    description:
      "Continuous discovery of internet-facing assets, including forgotten domains, exposed services, leaked credentials and misconfigured cloud storage, seen from an attacker's point of view.",
    deliverables: [
      "Continuous discovery of external assets and services",
      "Alerts for newly exposed or high-risk services",
      "Monitoring for leaked credentials and brand misuse",
      "Monthly external exposure report",
    ],
    prerequisites: ["List of known domains, IP ranges and brand names"],
    nistFunctions: ["Identify"],
    pricingUnit: "flatMonthly",
    unitCost: 60000,
    isAddOn: false,
  },
  {
    id: "svc-managed-firewall",
    name: "Managed Firewall / Network Security",
    category: "Network & Cloud",
    description:
      "Day-to-day administration of perimeter and internal firewalls, including change management, rule-base hygiene, firmware updates and health monitoring.",
    deliverables: [
      "Policy change management within agreed turnaround",
      "Quarterly rule-base review and clean-up",
      "Firmware and signature update management",
      "Device health and availability monitoring",
    ],
    prerequisites: [
      "Administrative access to managed devices",
      "Documented network diagram and change process",
    ],
    nistFunctions: ["Protect", "Detect"],
    pricingUnit: "flatMonthly",
    unitCost: 45000,
    isAddOn: false,
  },
  {
    id: "svc-cspm",
    name: "Cloud Security Posture Management",
    category: "Network & Cloud",
    description:
      "Continuous assessment of public cloud accounts against security best practice and compliance benchmarks, with guided remediation of misconfigurations.",
    deliverables: [
      "Continuous misconfiguration detection across cloud accounts",
      "Benchmark compliance scoring",
      "Prioritised remediation guidance",
      "Monthly cloud posture review",
    ],
    prerequisites: ["Read-only access roles for in-scope cloud accounts"],
    nistFunctions: ["Identify", "Protect"],
    pricingUnit: "flatMonthly",
    unitCost: 80000,
    isAddOn: false,
  },
  {
    id: "svc-identity-threat",
    name: "Identity Threat Monitoring",
    category: "Identity & Email",
    description:
      "Monitoring of directory and single sign-on activity for credential abuse, privilege escalation and suspicious authentication patterns, with response actions such as forced password reset or session revocation.",
    deliverables: [
      "Detection of risky sign-ins and credential attacks",
      "Privileged account change monitoring",
      "Identity-focused response actions under runbook",
      "Monthly identity risk report",
    ],
    prerequisites: [
      "Directory and identity provider logs onboarded",
      "Inventory of privileged and service accounts",
    ],
    nistFunctions: ["Detect", "Protect"],
    pricingUnit: "user",
    unitCost: 90,
    isAddOn: false,
  },
  {
    id: "svc-email-security",
    name: "Email Security Management",
    category: "Identity & Email",
    description:
      "Management of email filtering policies, user-reported phishing triage and domain authentication (SPF, DKIM, DMARC) to reduce phishing and spoofing risk.",
    deliverables: [
      "Email filtering policy management and tuning",
      "Triage of user-reported suspicious emails",
      "Domain authentication (SPF, DKIM, DMARC) rollout and monitoring",
      "Monthly email threat summary",
    ],
    prerequisites: ["Administrative access to the email platform and DNS"],
    nistFunctions: ["Protect", "Detect"],
    pricingUnit: "user",
    unitCost: 60,
    isAddOn: false,
  },
  {
    id: "svc-soar",
    name: "SOAR Playbook Automation",
    category: "Automation",
    description:
      "Design, build and maintenance of automated response playbooks that enrich alerts and carry out routine containment steps, reducing mean time to respond.",
    deliverables: [
      "Library of standard enrichment and response playbooks",
      "Custom playbooks for customer-specific workflows",
      "Quarterly playbook effectiveness review",
    ],
    prerequisites: [
      "API access to in-scope security and IT tools",
      "Approved automation guardrails",
    ],
    nistFunctions: ["Respond"],
    pricingUnit: "flatMonthly",
    unitCost: 70000,
    isAddOn: false,
  },
  {
    id: "svc-threat-intel",
    name: "Threat Intelligence Reporting",
    category: "Threat Intelligence",
    description:
      "Curated threat intelligence relevant to the customer's sector and geography, turned into actionable advisories and indicators that feed detection.",
    deliverables: [
      "Sector and region-specific monthly threat briefing",
      "Advisories for critical emerging threats within 24 hours",
      "Indicator feeds integrated into monitoring",
    ],
    prerequisites: ["Business profile: sector, geographies and key technologies"],
    nistFunctions: ["Identify", "Govern"],
    pricingUnit: "flatMonthly",
    unitCost: 40000,
    isAddOn: false,
  },
  {
    id: "svc-compliance-reporting",
    name: "Compliance Reporting",
    category: "Governance & Compliance",
    description:
      "Evidence collection and reporting mapped to ISO 27001, SOC 2 and India-specific requirements including RBI cyber security directions, SEBI CSCRF and the DPDP Act, supporting audits and board reporting.",
    deliverables: [
      "Control-mapped evidence packs for ISO 27001 and SOC 2",
      "Reporting aligned to RBI directions and SEBI CSCRF",
      "DPDP Act personal data breach readiness support",
      "Quarterly compliance posture report for leadership",
    ],
    prerequisites: [
      "Confirmed list of applicable frameworks and regulators",
      "Access to policy documents and control owners",
    ],
    nistFunctions: ["Govern", "Identify"],
    pricingUnit: "flatMonthly",
    unitCost: 100000,
    isAddOn: true,
  },
  {
    id: "svc-awareness-training",
    name: "Security Awareness Training",
    category: "People",
    description:
      "An ongoing awareness programme combining short training modules with simulated phishing campaigns to measurably reduce human risk.",
    deliverables: [
      "Role-based training modules with completion tracking",
      "Monthly simulated phishing campaigns",
      "Quarterly human-risk metrics report",
    ],
    prerequisites: ["User directory export and email allow-listing for simulations"],
    nistFunctions: ["Protect", "Govern"],
    pricingUnit: "user",
    unitCost: 50,
    isAddOn: true,
  },
];
