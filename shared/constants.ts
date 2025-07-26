// Shared constants for positions and countries across the application

export const FOOTBALL_POSITIONS = [
  // Goalkeepers
  "Goalkeeper",
  
  // Defenders
  "Centre-Back",
  "Left-Back", 
  "Right-Back",
  "Wing-Back",
  "Sweeper",
  
  // Midfielders
  "Defensive Midfielder",
  "Central Midfielder", 
  "Attacking Midfielder",
  "Left Midfielder",
  "Right Midfielder",
  "Box-to-Box Midfielder",
  
  // Forwards
  "Left Winger",
  "Right Winger", 
  "Centre-Forward",
  "Striker",
  "Second Striker",
  "False 9"
] as const;

export const AFRICAN_COUNTRIES = [
  "Algeria", "Angola", "Benin", "Botswana", "Burkina Faso", "Burundi", "Cameroon", 
  "Cape Verde", "Central African Republic", "Chad", "Comoros", "Congo", 
  "Democratic Republic of Congo", "Djibouti", "Egypt", "Equatorial Guinea", 
  "Eritrea", "Eswatini", "Ethiopia", "Gabon", "Gambia", "Ghana", "Guinea", 
  "Guinea-Bissau", "Ivory Coast", "Kenya", "Lesotho", "Liberia", "Libya", 
  "Madagascar", "Malawi", "Mali", "Mauritania", "Mauritius", "Morocco", 
  "Mozambique", "Namibia", "Niger", "Nigeria", "Rwanda", "São Tomé and Príncipe", 
  "Senegal", "Seychelles", "Sierra Leone", "Somalia", "South Africa", "South Sudan", 
  "Sudan", "Tanzania", "Togo", "Tunisia", "Uganda", "Zambia", "Zimbabwe"
] as const;

export const WORLD_COUNTRIES = [
  // African Countries (Primary Focus)
  ...AFRICAN_COUNTRIES,
  
  // European Countries
  "Albania", "Andorra", "Armenia", "Austria", "Azerbaijan", "Belarus", "Belgium", 
  "Bosnia and Herzegovina", "Bulgaria", "Croatia", "Cyprus", "Czech Republic", 
  "Denmark", "Estonia", "Finland", "France", "Georgia", "Germany", "Greece", 
  "Hungary", "Iceland", "Ireland", "Italy", "Kazakhstan", "Kosovo", "Latvia", 
  "Liechtenstein", "Lithuania", "Luxembourg", "Malta", "Moldova", "Monaco", 
  "Montenegro", "Netherlands", "North Macedonia", "Norway", "Poland", "Portugal", 
  "Romania", "Russia", "San Marino", "Serbia", "Slovakia", "Slovenia", "Spain", 
  "Sweden", "Switzerland", "Turkey", "Ukraine", "United Kingdom", "Vatican City",
  
  // North American Countries
  "Antigua and Barbuda", "Bahamas", "Barbados", "Belize", "Canada", "Costa Rica", 
  "Cuba", "Dominica", "Dominican Republic", "El Salvador", "Grenada", "Guatemala", 
  "Haiti", "Honduras", "Jamaica", "Mexico", "Nicaragua", "Panama", "Saint Kitts and Nevis", 
  "Saint Lucia", "Saint Vincent and the Grenadines", "Trinidad and Tobago", "United States",
  
  // South American Countries
  "Argentina", "Bolivia", "Brazil", "Chile", "Colombia", "Ecuador", "Guyana", 
  "Paraguay", "Peru", "Suriname", "Uruguay", "Venezuela",
  
  // Asian Countries
  "Afghanistan", "Bahrain", "Bangladesh", "Bhutan", "Brunei", "Cambodia", "China", 
  "India", "Indonesia", "Iran", "Iraq", "Israel", "Japan", "Jordan", "Kuwait", 
  "Kyrgyzstan", "Laos", "Lebanon", "Malaysia", "Maldives", "Mongolia", "Myanmar", 
  "Nepal", "North Korea", "Oman", "Pakistan", "Palestine", "Philippines", "Qatar", 
  "Saudi Arabia", "Singapore", "South Korea", "Sri Lanka", "Syria", "Tajikistan", 
  "Thailand", "Timor-Leste", "Turkmenistan", "United Arab Emirates", "Uzbekistan", 
  "Vietnam", "Yemen",
  
  // Oceanian Countries
  "Australia", "Fiji", "Kiribati", "Marshall Islands", "Micronesia", "Nauru", 
  "New Zealand", "Palau", "Papua New Guinea", "Samoa", "Solomon Islands", "Tonga", 
  "Tuvalu", "Vanuatu"
] as const;

// Position categories for easier filtering
export const POSITION_CATEGORIES = {
  GOALKEEPERS: ["Goalkeeper"],
  DEFENDERS: ["Centre-Back", "Left-Back", "Right-Back", "Wing-Back", "Sweeper"],
  MIDFIELDERS: ["Defensive Midfielder", "Central Midfielder", "Attacking Midfielder", "Left Midfielder", "Right Midfielder", "Box-to-Box Midfielder"],
  FORWARDS: ["Left Winger", "Right Winger", "Centre-Forward", "Striker", "Second Striker", "False 9"]
} as const;

export type FootballPosition = typeof FOOTBALL_POSITIONS[number];
export type AfricanCountry = typeof AFRICAN_COUNTRIES[number];
export type WorldCountry = typeof WORLD_COUNTRIES[number];