export const cityStates = [
  { city: "Montgomery", state: "AL" }, { city: "Birmingham", state: "AL" },
  { city: "Juneau", state: "AK" }, { city: "Anchorage", state: "AK" },
  { city: "Phoenix", state: "AZ" }, { city: "Tucson", state: "AZ" },
  { city: "Little Rock", state: "AR" }, { city: "Fayetteville", state: "AR" },
  { city: "Sacramento", state: "CA" }, { city: "Los Angeles", state: "CA" },
  { city: "Denver", state: "CO" }, { city: "Colorado Springs", state: "CO" },
  { city: "Hartford", state: "CT" }, { city: "New Haven", state: "CT" },
  { city: "Dover", state: "DE" }, { city: "Wilmington", state: "DE" },
  { city: "Tallahassee", state: "FL" }, { city: "Miami", state: "FL" },
  { city: "Atlanta", state: "GA" }, { city: "Savannah", state: "GA" },
  { city: "Honolulu", state: "HI" }, { city: "Hilo", state: "HI" },
  { city: "Boise", state: "ID" }, { city: "Idaho Falls", state: "ID" },
  { city: "Springfield", state: "IL" }, { city: "Chicago", state: "IL" },
  { city: "Indianapolis", state: "IN" }, { city: "Fort Wayne", state: "IN" },
  { city: "Des Moines", state: "IA" }, { city: "Cedar Rapids", state: "IA" },
  { city: "Topeka", state: "KS" }, { city: "Wichita", state: "KS" },
  { city: "Frankfort", state: "KY" }, { city: "Louisville", state: "KY" },
  { city: "Baton Rouge", state: "LA" }, { city: "New Orleans", state: "LA" },
  { city: "Augusta", state: "ME" }, { city: "Portland", state: "ME" },
  { city: "Annapolis", state: "MD" }, { city: "Baltimore", state: "MD" },
  { city: "Boston", state: "MA" }, { city: "Worcester", state: "MA" },
  { city: "Lansing", state: "MI" }, { city: "Detroit", state: "MI" },
  { city: "St. Paul", state: "MN" }, { city: "Minneapolis", state: "MN" },
  { city: "Jackson", state: "MS" }, { city: "Gulfport", state: "MS" },
  { city: "Jefferson City", state: "MO" }, { city: "Kansas City", state: "MO" },
  { city: "Helena", state: "MT" }, { city: "Billings", state: "MT" },
  { city: "Lincoln", state: "NE" }, { city: "Omaha", state: "NE" },
  { city: "Carson City", state: "NV" }, { city: "Las Vegas", state: "NV" },
  { city: "Concord", state: "NH" }, { city: "Manchester", state: "NH" },
  { city: "Trenton", state: "NJ" }, { city: "Newark", state: "NJ" },
  { city: "Santa Fe", state: "NM" }, { city: "Albuquerque", state: "NM" },
  { city: "Albany", state: "NY" }, { city: "New York", state: "NY" },
  { city: "Raleigh", state: "NC" }, { city: "Charlotte", state: "NC" },
  { city: "Bismarck", state: "ND" }, { city: "Fargo", state: "ND" },
  { city: "Columbus", state: "OH" }, { city: "Cleveland", state: "OH" },
  { city: "Oklahoma City", state: "OK" }, { city: "Tulsa", state: "OK" },
  { city: "Salem", state: "OR" }, { city: "Portland", state: "OR" },
  { city: "Harrisburg", state: "PA" }, { city: "Philadelphia", state: "PA" },
  { city: "Providence", state: "RI" }, { city: "Warwick", state: "RI" },
  { city: "Columbia", state: "SC" }, { city: "Charleston", state: "SC" },
  { city: "Pierre", state: "SD" }, { city: "Sioux Falls", state: "SD" },
  { city: "Nashville", state: "TN" }, { city: "Memphis", state: "TN" },
  { city: "Austin", state: "TX" }, { city: "Houston", state: "TX" },
  { city: "Salt Lake City", state: "UT" }, { city: "Provo", state: "UT" },
  { city: "Montpelier", state: "VT" }, { city: "Burlington", state: "VT" },
  { city: "Richmond", state: "VA" }, { city: "Virginia Beach", state: "VA" },
  { city: "Olympia", state: "WA" }, { city: "Seattle", state: "WA" },
  { city: "Charleston", state: "WV" }, { city: "Huntington", state: "WV" },
  { city: "Madison", state: "WI" }, { city: "Milwaukee", state: "WI" },
  { city: "Cheyenne", state: "WY" }, { city: "Casper", state: "WY" }
];

// 200 hospitals
const hospPrefixes = [
  "General", "Mercy", "St. Jude", "City", "Mount", "Valley", "Lakeside", "Regional",
  "Community", "County", "State", "University", "Methodist", "Baptist", "Children's",
  "Veterans", "Hope", "Good Samaritan", "Trinity", "Sacred Heart", "Memorial", "Pioneer",
  "Summit", "Evergreen", "Sunrise", "Crestview", "Oakridge", "Pinecrest", "Willow",
  "Maple", "Cedar", "Birch"
];
const hospSuffixes = [
  "Hospital", "Medical Center", "Clinic", "Healthcare", "Health System",
  "Medical Institute", "Care Center", "Sanatorium", "General Hospital", "Specialty Clinic"
];

export const generatedHospitals: Array<{ name: string; city: string; state: string }> = [];
for (let i = 0; i < 200; i++) {
  const loc = cityStates[i % cityStates.length];
  generatedHospitals.push({
    name: `${hospPrefixes[i % hospPrefixes.length]} ${hospSuffixes[Math.floor(i / hospPrefixes.length) % hospSuffixes.length]}`,
    city: loc.city,
    state: loc.state,
  });
}

// 14 insurances * 2 plans = 28 combos
export const generatedInsurances = [
  { provider: "Blue Cross", plan: "PPO Silver" }, { provider: "Blue Cross", plan: "HMO Gold" },
  { provider: "Aetna", plan: "HMO Basic" }, { provider: "Aetna", plan: "Choice POS II" },
  { provider: "Cigna", plan: "High Deductible" }, { provider: "Cigna", plan: "Open Access Plus" },
  { provider: "UnitedHealthcare", plan: "Choice Plus" }, { provider: "UnitedHealthcare", plan: "Navigate" },
  { provider: "Humana", plan: "HMO Premier" }, { provider: "Humana", plan: "PPO Standard" },
  { provider: "Kaiser Permanente", plan: "HMO Basic" }, { provider: "Kaiser Permanente", plan: "Advantage" },
  { provider: "Centene", plan: "Ambetter Essential" }, { provider: "Centene", plan: "Ambetter Balanced" },
  { provider: "Anthem", plan: "Pathway X" }, { provider: "Anthem", plan: "Blue Access PPO" },
  { provider: "Molina Healthcare", plan: "Core Care" }, { provider: "Molina Healthcare", plan: "Constant Care" },
  { provider: "Elevance Health", plan: "Essential" }, { provider: "Elevance Health", plan: "Premium" },
  { provider: "Oscar Health", plan: "Bronze Classic" }, { provider: "Oscar Health", plan: "Silver Classic" },
  { provider: "Caresource", plan: "Marketplace Bronze" }, { provider: "Caresource", plan: "Marketplace Silver" },
  { provider: "EmblemHealth", plan: "Select Care" }, { provider: "EmblemHealth", plan: "Millennium" },
  { provider: "Health Net", plan: "PureCare HSP" }, { provider: "Health Net", plan: "CommunityCare HMO" }
];

// 200 providers
const firstNames = [
  "James", "Mary", "Robert", "Patricia", "John", "Jennifer", "Michael", "Linda",
  "William", "Elizabeth", "David", "Barbara", "Richard", "Susan", "Joseph", "Jessica",
  "Thomas", "Sarah", "Charles", "Karen", "Christopher", "Nancy", "Daniel", "Lisa",
  "Matthew", "Betty", "Anthony", "Margaret", "Mark", "Sandra"
];
const lastNames = [
  "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
  "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson",
  "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson",
  "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson"
];

export const generatedProviders: string[] = [
  "Quest Diagnostics",
  "LabCorp",
  "City Imaging Services",
  "Advanced Pathology Labs",
];
for (let i = 0; i < 196; i++) {
  generatedProviders.push(`Dr. ${firstNames[i % firstNames.length]} ${lastNames[Math.floor(i / firstNames.length) % lastNames.length]}`);
}

// 400 CPT Codes
export const generatedCptCodes: Array<{ code: string, name: string, cost: number }> = [];
const adj = ["Diagnostic", "Routine", "Surgical", "Emergency", "Preventive", "Advanced", "Basic", "Follow-up", "Initial", "Complex"];
const type = ["Test", "Exam", "Panel", "Scan", "Therapy", "Consultation", "Screening", "Assessment", "Evaluation", "Monitoring"];
for (let i = 0; i < 400; i++) {
  const code = (10000 + i * 17).toString();
  generatedCptCodes.push({
    code,
    name: `${adj[i % adj.length]} ${type[Math.floor(i / adj.length) % type.length]}`,
    cost: Math.floor(Math.random() * 500000) + 15000 // $150 to $5150
  });
}

// 100 procedures
const procPrefix = ["Heart", "Brain", "Lung", "Knee", "Shoulder", "Spine", "Ankle", "Hip", "Liver", "Kidney", "Eye", "Ear", "Throat", "Skin", "Bone"];
const procAction = ["Surgery", "Replacement", "Repair", "Excision", "Biopsy", "Ultrasound", "MRI", "CT Scan", "X-Ray", "Therapy", "Reconstruction", "Transplant"];
export const generatedProceduresData: Array<{ desc: string, cpts: Array<{ code: string, name: string, cost: number }> }> = [];

// Seeded random function for consistent cpt count distribution
function randomIntFromInterval(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

for (let i = 0; i < 100; i++) {
  const numCpts = randomIntFromInterval(0, 20); // 0 to 20 cpt codes
  const procedureCpts = [];

  // To avoid duplicates in the same procedure, we can just randomly sample
  const shuffledCpts = [...generatedCptCodes].sort(() => 0.5 - Math.random());

  for (let j = 0; j < numCpts; j++) {
    procedureCpts.push(shuffledCpts[j]);
  }

  generatedProceduresData.push({
    desc: `${procPrefix[i % procPrefix.length]} ${procAction[Math.floor(i / procPrefix.length) % procAction.length]}`,
    cpts: procedureCpts
  });
}
