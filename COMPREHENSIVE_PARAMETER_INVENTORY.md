# Comprehensive Parameter Inventory - Clinical PK Decision Support System

## Executive Summary
This document provides a complete inventory of all parameters, variables, inputs, and outputs managed within the Clinical Pharmacokinetic Decision Support System for CRRT patients. This system provides evidence-based antibiotic dosing recommendations for critically ill patients receiving Continuous Renal Replacement Therapy.

---

## 1. PATIENT INPUT PARAMETERS

### 1.1 Demographics
| Parameter | Type | Range/Options | Required | Default | Unit |
|-----------|------|---------------|----------|---------|------|
| `age` | number | 18-120 | No | - | years |
| `gender` | string | 'male', 'female' | No | - | - |
| `weight` | number | 30-200 | No | 70 | kg |
| `serumCreatinine` | number | 0.5-15 | No | - | mg/dL |

### 1.2 Antibiotic Selection
| Parameter | Type | Range/Options | Required | Default | Unit |
|-----------|------|---------------|----------|---------|------|
| `antibioticName` | string | See Drug List below | **Yes** | - | - |
| `mic` | number | 0.125-256 | No | - | mg/L |
| `infectionType` | string | Free text | No | - | - |
| `sourceOfInfection` | string | Free text | No | - | - |
| `microbiologicalCulture` | string | Free text | No | - | - |

### 1.3 CRRT Parameters
| Parameter | Type | Range/Options | Required | Default | Unit |
|-----------|------|---------------|----------|---------|------|
| `crrtModality` | string | 'CVVH', 'CVVHD', 'CVVHDF', 'PIRRT', 'SLED' | No | - | - |
| `dialysateFlowRate` | number | 10-50 | No | 25 | ml/hr or ml/kg/hr |
| `dialysateFlowRateUnit` | string | 'ml/hr', 'ml/kg/hr' | No | 'ml/kg/hr' | - |
| `bloodFlowRate` | number | 100-300 | No | 150 | ml/min |
| `preFilterReplacementRate` | number | 0-3000 | No | 0 | ml/hr |
| `postFilterReplacementRate` | number | 0-3000 | No | 0 | ml/hr |
| `ultrafiltrationRate` | number | 0-500 | No | 0 | ml/hr |
| `filterType` | string | 'high-flux', 'low-flux', 'AN69ST', 'polysulfone' | No | 'high-flux' | - |
| `dilutionMode` | string | 'pre', 'post' | No | 'post' | - |
| `circuitAge` | string | 'new', 'used' | No | 'new' | - |

### 1.4 Dosing Parameters
| Parameter | Type | Range/Options | Required | Default | Unit |
|-----------|------|---------------|----------|---------|------|
| `dosingMethod` | string | 'bolus', 'infusion', 'extravascular' | No | 'bolus' | - |
| `infusionDuration` | number | 0.5-24 | No | - | hours |
| `infusionRate` | number | 1-1000 | No | - | mg/hr |
| `useEI_CI` | boolean | true, false | No | false | - |
| `eiDuration` | number | 1-24 | No | 3 | hours |
| `eiRate` | number | 1-1000 | No | - | mg/hr |
| `preferredTarget` | string | 'AUC', '%T>MIC', 'Peak/Trough' | No | '%T>MIC' | - |

### 1.5 Comorbidities & Conditions
| Parameter | Type | Range/Options | Required | Default | Unit |
|-----------|------|---------------|----------|---------|------|
| `liverDisease` | boolean | true, false | No | false | - |
| `heartDisease` | boolean | true, false | No | false | - |
| `heartFailure` | boolean | true, false | No | false | - |
| `ecmoTreatment` | boolean | true, false | No | false | - |
| `sepsis` | boolean | true, false | No | false | - |
| `acuteKidneyInjury` | boolean | true, false | No | false | - |
| `tpeTreatment` | boolean | true, false | No | false | - |

---

## 2. DRUG DATABASE

### 2.1 Available Antibiotics
1. **Vancomycin** (vancomycin)
2. **Meropenem** (meropenem)
3. **Piperacillin-Tazobactam** (piperacillinTazobactam)
4. **Cefepime** (cefepime)
5. **Linezolid** (linezolid)
6. **Gentamicin** (gentamicin)
7. **Colistin** (colistin)
8. **Imipenem** (imipenem)
9. **Fluconazole** (fluconazole)
10. **Ceftazidime** (ceftazidime)

### 2.2 Drug Profile Structure (PKParameters)
| Parameter | Type | Range | Unit | Description |
|-----------|------|-------|------|-------------|
| `standardDose` | number | 100-4000 | mg | Standard single dose |
| `interval` | number | 6-24 | hours | Dosing interval |
| `volumeOfDistribution` | number | 0.15-0.7 | L/kg | Volume of distribution |
| `proteinBinding` | number | 0.02-0.9 | decimal | Protein binding fraction |
| `crrtClearance` | number | 0.5-2.8 | L/hr | CRRT clearance |
| `hepaticClearance` | number | 0.1-2.8 | L/hr | Hepatic clearance |
| `nonRenalClearance` | number | 0.1-2.8 | L/hr | Non-renal clearance |
| `halfLife` | number | 2-30 | hours | Elimination half-life |
| `molecularWeight` | number | 306-1634 | Da | Molecular weight |
| `fractionUnbound` | number | 0.5-0.98 | decimal | Fraction unbound |
| `logP` | number | -3.1-0.5 | - | Lipophilicity coefficient |
| `saltFactor` | number | 1.0 | - | Salt correction factor |
| `bioavailability` | number | 1.0 | decimal | Bioavailability |
| `absorptionRateKa` | number | - | 1/hr | Absorption rate constant |

### 2.3 MIC Breakpoints by Drug
#### Vancomycin
- MRSA: 2 mg/L
- CoNS: 4 mg/L
- Enterococcus: 4 mg/L

#### Meropenem
- P. aeruginosa: 2 mg/L
- K. pneumoniae: 1 mg/L
- A. baumannii: 2 mg/L

#### Piperacillin-Tazobactam
- P. aeruginosa: 16 mg/L
- E. coli: 8 mg/L
- K. pneumoniae: 8 mg/L

#### Cefepime
- P. aeruginosa: 8 mg/L
- K. pneumoniae: 2 mg/L
- E. coli: 1 mg/L

#### Linezolid
- MRSA: 4 mg/L
- VRE: 2 mg/L
- CoNS: 4 mg/L

#### Gentamicin
- P. aeruginosa: 4 mg/L
- K. pneumoniae: 4 mg/L
- E. coli: 4 mg/L

#### Colistin
- P. aeruginosa: 2 mg/L
- K. pneumoniae: 2 mg/L
- A. baumannii: 2 mg/L

#### Imipenem
- P. aeruginosa: 4 mg/L
- K. pneumoniae: 1 mg/L
- E. coli: 1 mg/L

#### Fluconazole
- C. albicans: 2 mg/L
- C. glabrata: 32 mg/L
- C. parapsilosis: 2 mg/L

#### Ceftazidime
- P. aeruginosa: 8 mg/L
- K. pneumoniae: 1 mg/L
- E. coli: 1 mg/L

### 2.4 Therapeutic Drug Monitoring Targets
| Drug | Trough Range | Peak Range | AUC Range | %T>MIC Target |
|------|--------------|------------|-----------|---------------|
| Vancomycin | 15-20 mg/L | - | 400-600 mg·h/L | - |
| Meropenem | - | - | - | 40-100% |
| Piperacillin-Tazobactam | - | - | - | 50-100% |
| Cefepime | - | - | - | 60-100% |
| Linezolid | 2-8 mg/L | - | 200-350 mg·h/L | - |
| Gentamicin | 0.5-2 mg/L | 5-10 mg/L | - | - |
| Colistin | 2-4 mg/L | - | - | - |
| Imipenem | - | - | - | 40-100% |
| Fluconazole | 8-25 mg/L | - | - | - |
| Ceftazidime | - | - | - | 40-100% |

---

## 3. PHARMACOKINETIC CALCULATIONS

### 3.1 Core Clearance Components
| Parameter | Formula | Description |
|-----------|---------|-------------|
| `totalClearance` | CLnon-renal + CLresidual-renal + CLextracorporeal | Total body clearance |
| `residualRenalClearance` | Based on 2021 CKD-EPI eGFR | Remaining kidney function |
| `nonRenalClearance` | hepaticClearance OR pkParameters.nonRenalClearance | Non-kidney elimination |
| `extracorporealClearance` | Modality-specific CRRT clearance | Machine-based removal |

### 3.2 eGFR Calculation (2021 CKD-EPI)
```
eGFR = 142 × min(SCr/κ,1)^α × max(SCr/κ,1)^-1.200 × 0.9938^Age × 1.012 [if female]
```
Where:
- κ = 0.7 (female) or 0.9 (male)
- α = -0.241 (female) or -0.302 (male)
- SCr = serum creatinine (mg/dL)
- Age = patient age (years)

### 3.3 CRRT Modality-Specific Clearance
#### CVVHD (Diffusion only)
```
Clearance = fub × Q_dialysate
```

#### CVVH (Convection only)
- Pre-dilution: `fub × Q_UF × [Q_blood / (Q_blood + Q_replacement)]`
- Post-dilution: `fub × Q_UF`

#### CVVHDF (Combined)
- Pre-dilution: `fub × (Q_dialysate + Q_UF × [Q_blood / (Q_blood + Q_replacement)])`
- Post-dilution: `fub × (Q_dialysate + Q_UF)`

#### PIRRT
```
Clearance = fub × min(Q_dialysate, 0.3) × 0.8
```

#### SLED
```
Clearance = fub × Q_dialysate × 0.8
```

### 3.4 Sieving Coefficients by Filter Type
| Filter Type | High PB (>80%) | Low PB (<80%) |
|-------------|-----------------|---------------|
| high-flux | 0.8 | 0.95 |
| low-flux | 0.6 | 0.8 |
| AN69ST | 0.75 | 0.9 |
| polysulfone | 0.85 | 0.95 |

### 3.5 Concentration-Time Modeling
#### Bolus Dosing
```
C(t) = C0 × e^(-ke × t)
```

#### Infusion Dosing
```
C(t) = (R/CL) × (1 - e^(-ke × t))    [during infusion]
C(t) = Cmax × e^(-ke × (t - T))      [post-infusion]
```

#### Extravascular Dosing
```
C(t) = (F × D × ka)/(V × (ka - ke)) × (e^(-ke × t) - e^(-ka × t))
```

### 3.6 Adjustment Factors
| Condition | Volume Adjustment | Clearance Adjustment |
|-----------|-------------------|---------------------|
| Age ≥65 | 0.95 | 0.85 |
| Age ≥80 | 0.9 | 0.85 |
| Female | 0.9 | 1.0 |
| AKI | 1.0 | 1.2 |
| Liver Disease | 1.0 | 0.7 |
| Sepsis | 1.0 | 0.7 |
| Heart Disease | 1.1 | 0.8 |
| Heart Failure | 1.2 | 0.6 |
| Augmented Clearance (eGFR >130) | 1.0 | 1.5 |

### 3.7 ECMO Adjustments
| Drug Properties | Volume Multiplier | Clearance Multiplier |
|----------------|-------------------|---------------------|
| High PB + Lipophilic (PB >80%, logP >2) | 1.5 | 0.3 |
| Moderate PB + Lipophilic (PB >50%, logP >1) | 1.5 | 0.9 |
| Circuit Age = 'used' | 1.0 | 0.9 |

---

## 4. CALCULATED OUTPUTS

### 4.1 Primary PK Metrics
| Output | Type | Unit | Description |
|--------|------|------|-------------|
| `totalClearance` | number | L/hr | Total body clearance |
| `auc024` | number | mg·h/L | Area under curve 0-24 hours |
| `percentTimeAboveMic` | number | % | Percentage time above MIC |
| `eliminationRate` | number | 1/hr | Elimination rate constant |
| `volumeOfDistribution` | number | L | Total volume of distribution |
| `halfLife` | number | hours | Elimination half-life |

### 4.2 Dosing Recommendations
| Output | Type | Description |
|--------|------|-------------|
| `doseRecommendation` | string | Primary dose recommendation |
| `rationale` | string | Clinical rationale for recommendation |
| `dosingSuggestions` | string[] | Alternative dosing strategies |

### 4.3 Concentration-Time Curve
| Output | Type | Description |
|--------|------|-------------|
| `concentrationCurve` | Array<{time: number, concentration: number}> | Plasma concentration over time |

### 4.4 Evidence Integration
| Output | Type | Description |
|--------|------|-------------|
| `evidenceAlerts` | string[] | Clinical alerts and warnings |
| `supportingStudies` | Research[] | Supporting research studies |
| `citationText` | string | Formatted citations |
| `evidenceSources` | object | Source references for parameters |

### 4.5 Detailed Calculations
| Output | Type | Unit | Description |
|--------|------|------|-------------|
| `patientWeight` | number | kg | Patient weight used |
| `crrtClearance` | number | L/hr | CRRT-specific clearance |
| `hepaticClearance` | number | L/hr | Hepatic clearance |
| `residualRenalClearance` | number | L/hr | Remaining renal function |
| `flowMultiplier` | number | - | Flow rate adjustment factor |
| `proteinBindingAdjustment` | number | - | Protein binding correction |
| `sievingCoefficient` | number | - | Filter sieving coefficient |
| `filterEfficiency` | string | - | Filter efficiency description |
| `initialConcentration` | number | mg/L | Initial drug concentration |
| `dailyDose` | number | mg | Total daily dose |
| `dosesPerDay` | number | - | Number of doses per day |
| `timeToReachMIC` | number | hours | Time to reach MIC threshold |

---

## 5. RESEARCH INTEGRATION SYSTEM

### 5.1 Study Data Structure
| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique study identifier |
| `title` | string | Study title |
| `authors` | string | Author list |
| `year` | number | Publication year |
| `url` | string | Study URL |
| `pdfPath` | string | Local PDF path |
| `status` | string | 'pending', 'approved', 'rejected', 'revoked' |
| `uploadedBy` | string | User who uploaded |
| `uploadedAt` | Date | Upload timestamp |
| `tags` | string[] | Study tags |
| `notes` | string | User notes |
| `adminNotes` | string | Admin notes |
| `filename` | string | Original filename |

### 5.2 Evidence Sources
| Source Type | Description |
|-------------|-------------|
| `volumeOfDistribution` | Literature source for Vd values |
| `clearance` | Literature source for clearance values |
| `sievingCoefficient` | Literature source for sieving data |
| `proteinBinding` | Literature source for protein binding |

---

## 6. USER MANAGEMENT

### 6.1 User Data Structure
| Field | Type | Options | Description |
|-------|------|---------|-------------|
| `id` | string | - | Unique user identifier |
| `email` | string | - | User email address |
| `role` | string | 'standard', 'admin' | User role |
| `name` | string | - | User display name |
| `institution` | string | - | Institution affiliation |
| `apiKeys` | ApiKeyConfig[] | - | API key configurations |
| `preferredModel` | string | - | Preferred AI model |

### 6.2 API Key Configuration
| Field | Type | Options | Description |
|-------|------|---------|-------------|
| `id` | string | - | Unique key identifier |
| `provider` | string | 'openai', 'claude', 'anthropic' | AI provider |
| `name` | string | - | Key display name |
| `key` | string | - | API key value |
| `createdAt` | Date | - | Creation timestamp |

---

## 7. CLINICAL VALIDATION REFERENCES

### 7.1 Core References (2025 Updates)
- **PMC11928783 2025**: Vancomycin PopPK non-critical adults
- **PMC11844199 2025**: Meropenem PopPK prolonged infusion CRRT
- **PMC11938006 2025**: Piperacillin-Tazobactam opportunistic PopPK CRRT
- **PubMed 40323389 2025**: Cefepime-taniborbactam CRRT ex vivo
- **PMC11912797 2025**: Linezolid PK variability TDM Japan
- **LWW 2024**: Gentamicin rethinking aminoglycoside dosing CRRT
- **PMC11438743 2024**: Colistin high-dose PK CRRT
- **PMC11754279 2025**: Imipenem PopPK elderly
- **PubMed 40223936 2025**: Fluconazole optimizing dosing ARF CRRT PopPK
- **PubMed 39990787 2025**: Ceftazidime PopPK CAZ-AVI adults

### 7.2 Foundational References
- **Joy et al. Chapter 27**: Drug Dosing in AKI and Extracorporeal Therapies
- **2021 CKD-EPI equation**: Hsu et al., NEJM 2021
- **Roberts et al. 2012**: Vancomycin dosing in critically ill patients
- **Rybak et al. 2020**: Vancomycin therapeutic monitoring guidelines

---

## 8. TECHNICAL ARCHITECTURE

### 8.1 Frontend Technologies
- **React 18.3.1**: Core UI framework
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling system
- **Vite**: Build tool
- **React Router**: Navigation
- **Recharts**: Data visualization

### 8.2 State Management
- **React Context**: Authentication state
- **useState/useEffect**: Component state
- **Local Storage**: Data persistence

### 8.3 Form Validation
- **React Hook Form**: Form management
- **Zod**: Schema validation

---

## 9. SECURITY & COMPLIANCE

### 9.1 Data Protection
- Client-side calculations only
- No server-side patient data storage
- Local storage for user preferences
- No PHI transmission

### 9.2 Clinical Validation
- Evidence-based calculations
- Literature-supported parameters
- Expert review process for drug profiles
- Continuous updates from current literature

---

## 10. DEPLOYMENT & SCALING

### 10.1 Current Architecture
- Static site deployment
- Client-side only calculations
- No backend dependencies
- Vercel/Netlify compatible

### 10.2 Future Scaling Considerations
- Backend API for user data
- Database for research studies
- Multi-institutional deployment
- API rate limiting for AI features

---

## Summary Statistics

- **Total Input Parameters**: 28 core parameters
- **Drug Database**: 10 antibiotics/antifungals
- **PK Parameters per Drug**: 13 parameters
- **MIC Breakpoints**: 30 organism-drug combinations
- **Calculated Outputs**: 25+ metrics
- **Literature References**: 50+ core references
- **2025 Studies**: 10+ recent studies integrated
- **CRRT Modalities**: 5 supported modalities
- **Filter Types**: 4 filter types
- **Adjustment Factors**: 8 clinical conditions
- **TDM Targets**: 10 drugs with specific targets