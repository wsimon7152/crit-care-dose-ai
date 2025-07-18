# Clinical Pharmacokinetic Decision Support System - Data Inventory

## Executive Summary
This document provides a comprehensive inventory of all data, inputs, outputs, formulas, references, and intellectual property contained within the Clinical Pharmacokinetic Decision Support System for CRRT patients.

---

## 1. APPLICATION PURPOSE & SCOPE

### Primary Purpose
Evidence-based antibiotic dosing recommendations for critically ill patients receiving Continuous Renal Replacement Therapy (CRRT)

### Target Users
- Clinical pharmacists
- Intensivists
- Nephrologists
- Critical care nurses
- Healthcare researchers

### Problems Solved
- Optimization of antibiotic dosing in CRRT patients
- Reduction of treatment failures due to under-dosing
- Prevention of toxicity from over-dosing
- Integration of latest pharmacokinetic research into clinical practice
- Standardization of CRRT dosing protocols

---

## 2. PATIENT INPUT PARAMETERS

### Demographics Section
- **Age** (years) - Number input
- **Gender** - Select: Male, Female
- **Weight** (kg) - Number input
- **Serum Creatinine** (mg/dL) - Number input (step 0.1, typical range 1.0-2.5 for elderly)

### Antibiotic Section
- **Antibiotic Selection** - Required dropdown selection from 10 available drugs
- **MIC** (mg/L) - Number input (step 0.1, typical breakpoint 4-8)
- **Preferred Target** - Select: AUC, %T>MIC, Peak/Trough (auto-populated based on drug)
- **Extended/Continuous Infusion** - Checkbox with sub-options:
  - Infusion Duration (h) - Default 3h
  - Infusion Rate (mg/h) - Optional manual override
- **Infection Type** - Select: Pneumonia, Bacteremia, UTI, Intra-abdominal, Skin/Soft Tissue

### CRRT Parameters Section
- **CRRT Modality** - Required select: CVVH, CVVHD, CVVHDF
- **Blood Flow Rate** (mL/min) - Number input (typical 150-200 for elderly)
- **Filter/Device Type** - Select from 10 filter options including:
  - High-flux (default)
  - Prismax HF1000, HF1400
  - Multifiltrate AEV1000, AEV600
  - Fresenius HF1000, HF1400
  - Baxter ST100, ST150
  - Low-flux
- **Dialysate Flow Rate** - Required for CVVHDF (mL/hr or mL/kg/hr)
- **Pre-filter Replacement Rate** (mL/hr) - Required for CVVHDF
- **Post-filter Replacement Rate** (mL/hr) - Required for CVVHDF
- **Ultrafiltration Rate** (mL/hr) - Number input (typical 100-200 for elderly)

### Comorbidities Section (Checkboxes)
- **Liver Disease**
- **Heart Disease** 
- **Heart Failure**
- **ECMO Treatment**

### Additional Parameters (Referenced in calculations)
- Acute Kidney Injury (boolean)
- Sepsis (boolean)
- TPE Treatment (boolean)
- Circuit Age (for ECMO)

---

## 3. DRUG DATABASE

### Available Antibiotics (10 total)
1. **Vancomycin**
2. **Meropenem** 
3. **Piperacillin-Tazobactam**
4. **Cefepime**
5. **Linezolid**
6. **Gentamicin**
7. **Colistin**
8. **Imipenem**
9. **Fluconazole**
10. **Ceftazidime**

### Drug Profile Data Structure
Each drug contains the following complete dataset:

#### Pharmacokinetic Parameters
- **Standard Dose** (mg)
- **Dosing Interval** (hours)
- **Volume of Distribution** (L/kg)
- **Protein Binding** (fraction 0-1)
- **CRRT Clearance** (L/h) - 2025 study-based values
- **Hepatic Clearance** (L/h)
- **Non-Renal Clearance** (L/h)
- **Half-Life** (hours)
- **Molecular Weight** (g/mol)
- **Fraction Unbound** (0-1)
- **LogP** (lipophilicity)
- **Salt Factor**
- **Bioavailability** (0-1)

#### MIC Breakpoints
Each drug includes organism-specific MIC values:
- **Vancomycin**: MRSA (2), CoNS (4), Enterococcus (4)
- **Meropenem**: P. aeruginosa (2), K. pneumoniae (1), A. baumannii (2)
- **Piperacillin-Tazobactam**: P. aeruginosa (16), E. coli (8), K. pneumoniae (8)
- **Cefepime**: P. aeruginosa (8), K. pneumoniae (2), E. coli (1)
- **Linezolid**: MRSA (4), VRE (2), CoNS (4)
- **Gentamicin**: P. aeruginosa (4), K. pneumoniae (4), E. coli (4)
- **Colistin**: P. aeruginosa (2), K. pneumoniae (2), A. baumannii (2)
- **Imipenem**: P. aeruginosa (4), K. pneumoniae (1), E. coli (1)
- **Fluconazole**: C. albicans (2), C. glabrata (32), C. parapsilosis (2)
- **Ceftazidime**: P. aeruginosa (8), K. pneumoniae (1), E. coli (1)

#### Therapeutic Drug Monitoring (TDM) Targets
- **AUC Targets** - Min/max values in mg·h/L
- **Trough Targets** - Min/max values in mg/L
- **Peak Targets** - Min/max values in mg/L
- **%T>MIC Targets** - Min/max percentages

#### Dosing Suggestions
Each drug contains 4 evidence-based clinical dosing recommendations

#### References
Each drug profile includes 5 key literature references, including 2025 studies

---

## 4. PHARMACOKINETIC CALCULATIONS & FORMULAS

### Core Calculation Engine
Based on: Equations document, Chapter 27: Drug Dosing in AKI and Extracorporeal Therapies by M. Joy et al.

#### Primary Clearance Calculation
```
Total Clearance = Non-Renal Clearance + Residual Renal Clearance + Extracorporeal Clearance
```

#### Renal Function Assessment
- **2021 CKD-EPI equation for eGFR calculation**
- **Residual renal clearance calculations**
- **Augmented renal clearance detection (eGFR >130 mL/min/1.73m²)**

#### CRRT Clearance Calculations
Modality-specific equations for:
- **CVVH** (Continuous Venovenous Hemofiltration)
- **CVVHD** (Continuous Venovenous Hemodialysis)  
- **CVVHDF** (Continuous Venovenous Hemodiafiltration)
- **PIRRT** (Prolonged Intermittent Renal Replacement Therapy)
- **SLED** (Sustained Low-Efficiency Dialysis)

#### Sieving Coefficient Calculations
Filter-specific and drug-specific sieving coefficients based on:
- Filter type (high-flux vs low-flux)
- Drug protein binding
- Molecular weight considerations

#### Concentration-Time Modeling
Mathematical models for three dosing methods:
1. **Bolus Dosing**: C(t) = C₀ × e^(-ke×t)
2. **Infusion Dosing**: Complex multi-phase equations
3. **Extravascular Dosing**: Absorption-elimination models

#### Adjustments Applied
- **Age-based adjustments** (≥65 years: 15% clearance reduction)
- **Gender-based adjustments** (Female: 10% Vd reduction)
- **AKI augmented clearance** (20% increase)
- **Liver disease** (30% non-renal clearance reduction)
- **Sepsis** (30% metabolism reduction)
- **Heart disease/failure** (Variable clearance and Vd impacts)
- **ECMO adjustments** (Circuit age-dependent)

---

## 5. CALCULATED OUTPUTS

### Primary Results
- **Dose Recommendation** - Specific mg and interval with rationale
- **Total Clearance** (L/h)
- **AUC₀₋₂₄** (mg·h/L)
- **%T>MIC** (percentage)
- **Concentration-Time Curve** (24-hour profile data points)

### Advanced Metrics
- **Elimination Rate** (h⁻¹)
- **Volume of Distribution** (L)
- **Initial Concentration** (mg/L)
- **Time to Reach MIC** (hours)
- **Sieving Coefficient** (filter-specific)
- **Filter Efficiency** assessment
- **Flow Multiplier** (CRRT-specific)
- **Protein Binding Adjustment**

### Clinical Alerts System
- **Evidence-based alerts** from platform research
- **TDM recommendations** (drug-specific)
- **Toxicity warnings** (AUC/concentration caps)
- **Extended infusion suggestions** (auto-triggered)
- **TPE considerations** (highly protein-bound drugs)
- **Research gap notifications**

### Evidence Integration
- **Supporting studies** list
- **Citation text** generation
- **Research alerts** based on approved studies
- **Study-adjusted PK parameters**

---

## 6. RESEARCH INTEGRATION SYSTEM

### Study Management
- **Local storage-based** research database
- **Study approval workflow** (pending → approved → rejected)
- **Metadata capture**: Title, authors, year, URL, tags, notes
- **Upload date tracking**

### Evidence Integration Features
- **Real-time study relevance** determination
- **Drug and CRRT-specific** study filtering
- **Evidence alerts** generation based on study findings
- **PK parameter adjustments** from research
- **Citation generation** for transparency
- **Study conflict detection**
- **Research gap identification**

### AI Integration Capabilities
- **Study-integrated prompt** generation
- **Research summary** incorporation
- **Evidence-based rationale** enhancement

---

## 7. KEY INTELLECTUAL PROPERTY & FORMULAS

### Proprietary Algorithms
1. **Dynamic Dosing Algorithm** - Adjusts doses based on preferred target (AUC/%T>MIC/Peak-Trough)
2. **Toxicity Capping System** - Auto-reduces doses when %T>MIC >100% or AUC exceeds toxicity thresholds
3. **Auto-EI Suggestion Logic** - Triggers extended infusion recommendations with PMC citation
4. **Research Integration Engine** - Real-time study incorporation into dosing decisions
5. **CRRT Modality-Specific Calculations** - Advanced clearance modeling per therapy type

### Core Mathematical Models
- **Multi-compartment PK modeling** for concentration curves
- **2021 CKD-EPI implementation** for renal function
- **ECMO circuit age adjustments** (novel approach)
- **Filter-specific sieving calculations** 
- **Protein binding adjustment algorithms**

### Evidence Sources Integration
- **2025 pharmacokinetic studies** (10+ recent PMC citations)
- **Real-time research database** integration
- **Study verification protocols**
- **Evidence strength weighting**

### Clinical Decision Logic
- **Target-based dosing selection** (AUC vs %T>MIC vs Peak/Trough)
- **Infection severity adjustments**
- **Multi-comorbidity impact modeling**
- **CRRT intensity considerations**

---

## 8. LITERATURE REFERENCES & CITATIONS

### Primary Literature Database (per drug)
Each drug profile contains 5 key references, totaling **50 core references**

### 2025 Studies Integration
- **PMC11928783 2025** - Vancomycin PopPK non-critical adults
- **PMC11844199 2025** - Meropenem PopPK prolonged infusion CRRT
- **PMC11938006 2025** - Piperacillin-Tazobactam opportunistic PopPK CRRT
- **PubMed 40323389 2025** - Cefepime-taniborbactam CRRT
- **ScienceDirect 2023/PMC11912797 2025** - Linezolid RRT modalities
- **LWW 2024** - Gentamicin rethinking aminoglycoside dosing CRRT
- **PMC11438743 2024** - Colistin high-dose PK CRRT
- **PMC11754279 2025** - Imipenem PopPK elderly
- **PubMed 40223936 2025** - Fluconazole optimizing dosing ARF CRRT
- **PubMed 39990787 2025** - Ceftazidime PopPK CAZ-AVI adults

### Foundational References
- **Roberts et al. 2012** - CRRT antibiotic dosing fundamentals
- **Rybak et al. 2020** - Vancomycin therapeutic guidelines
- **Chapter 27: Drug Dosing in AKI and Extracorporeal Therapies** - M. Joy et al.
- **2021 CKD-EPI equation** - Renal function assessment

---

## 9. TECHNICAL ARCHITECTURE DATA

### Frontend Components
- **PatientInputForm** - Main data collection interface
- **PKResultsDisplay** - Comprehensive results presentation
- **ResearchManagement** - Study upload and management
- **Navigation** - Application routing
- **Form Sections** (5 modular components):
  - DemographicsSection
  - CRRTParametersSection 
  - AntibioticSection
  - ComorbiditiesSection
  - CRRTModalityInfo

### Services Layer
- **PKCalculationService** - Core calculation engine (963 lines)
- **ResearchIntegrationService** - Study management and integration
- **StudyVerificationService** - Research validation
- **AIService** - AI prompt generation and processing

### Data Layer
- **drugProfiles.ts** - Complete drug database (338 lines)
- **types/index.ts** - TypeScript interface definitions
- **Local storage** - Research study persistence

### UI Components
- **Shadcn/ui component library** (30+ components)
- **Recharts** - Concentration curve visualization
- **React Hook Form** - Form state management
- **Tailwind CSS** - Styling system

---

## 10. REGULATORY & COMPLIANCE CONSIDERATIONS

### Clinical Validation Requirements
- **Evidence-based calculations** from peer-reviewed literature
- **Study verification protocols** for research integration
- **Transparency features** (calculation details, references)
- **Clinical alert systems** for safety

### Data Protection
- **No PHI storage** - session-based calculations only
- **Local research storage** - institutional control
- **Audit trail capabilities** for clinical decisions

### Quality Assurance
- **Reference validation** for all drug parameters
- **Calculation verification** against published equations
- **Alert system validation** for clinical safety
- **Research integration** quality controls

---

## SUMMARY STATISTICS

- **Total Drug Profiles**: 10 complete antibiotics/antifungals
- **Input Parameters**: 25+ patient and therapy parameters
- **Output Metrics**: 15+ calculated results and alerts
- **Calculation Methods**: 5+ specialized PK modeling approaches
- **CRRT Modalities**: 5 supported therapy types
- **Filter Types**: 10 device-specific options
- **Literature References**: 50+ core citations including 10+ 2025 studies
- **Code Base**: 2000+ lines of calculation logic
- **Clinical Alerts**: 10+ evidence-based alert types
- **Research Integration**: Dynamic study incorporation system

This system represents a comprehensive clinical decision support tool with substantial intellectual property in the form of integrated pharmacokinetic modeling, evidence-based dosing algorithms, and real-time research integration capabilities for critically ill CRRT patients.