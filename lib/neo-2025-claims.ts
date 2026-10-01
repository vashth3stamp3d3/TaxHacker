/**
 * Claimable 2025 print-shop charges on Neo Financial Mastercard •••• 6233
 * (Jerrold Jacobe, personal card). Each line is a shareholder-loan expense
 * unless it is capital equipment.
 *
 * Canadian GST-registered merchants are split 5/105. Foreign charges have
 * no GST on the statement.
 *
 * Not claimed here (personal or already on the books): Allstate, Fido/Rogers,
 * Shaw home internet, Shell/Super Save gas, Costco/Walmart/grocery, extra
 * Amazon.ca, Shopify Inc Ottawa platform fees, Best Buy, IKEA, StovePay,
 * Twenty20, Temu, Disneyland and other California trip spend, Alibaba Klarna
 * instalments (FP-0037–FP-0046), ENMAX (already on 2300), and the PayPal
 * TradingView card charge (booked from invoice FP-0055).
 *
 * Restaurant, coffee, and food-delivery charges are claimed on 6100 Meals.
 * Books take 100% of the meal; T2 Schedule 1 adds back 50% as
 * meals_nondeductible.
 */

export const NEO_2025_SOURCE = "neo-2025-card"
export const NEO_CARD_LAST4 = "6233"

export const NEO_GST_INCLUSIVE_KINDS = [
  "blanks",
  "uline",
  "homedepot",
  "ctire",
  "rona",
  "memex",
  "msft",
  "ups",
  "purolator",
  "chitchats",
  "trexity",
  "metal",
  "meals",
] as const

export const NEO_ACCOUNT_NAMES: Record<string, string> = {
  "1600": "Equipment",
  "5000": "Paper Cost",
  "5040": "Shipping Cost",
  "5100": "Supplies Expense",
  "6020": "Software",
  "6050": "Marketing",
  "6100": "Meals and Entertainment",
}

export type NeoClaimKind =
  | "blanks" | "bambu" | "uline" | "homedepot" | "ctire" | "rona" | "memex" | "adobe" | "msft"
  | "cursor" | "openai" | "eleven" | "xai" | "blackmagic" | "blackforest" | "meta" | "ups"
  | "purolator" | "chitchats" | "trexity" | "nucleo" | "metal" | "meals"

export type NeoClaim = {
  postedOn: string
  kind: NeoClaimKind
  accountCode: string
  label: string
  description: string
  totalCents: number
  netCents: number
  gstCents: number
  ccaClass?: "class8" | "class50"
}

export const NEO_2025_CLAIMS: NeoClaim[] = [
  { postedOn: "2025-01-01", kind: "meals", accountCode: "6100", label: "McDonald's", description: "MCDONALD'S #40888 CALGARY CAN", totalCents: 150, netCents: 143, gstCents: 7 },
  { postedOn: "2025-01-02", kind: "meals", accountCode: "6100", label: "McDonald's", description: "MCDONALD'S #40888 CALGARY CAN", totalCents: 150, netCents: 143, gstCents: 7 },
  { postedOn: "2025-01-03", kind: "ctire", accountCode: "5100", label: "Canadian Tire shop supplies", description: "CANADIAN TIRE #419 CALGARY CAN", totalCents: 5457, netCents: 5197, gstCents: 260 },
  { postedOn: "2025-01-04", kind: "meals", accountCode: "6100", label: "McDonald's", description: "MCDONALD'S #40888 CALGARY CAN", totalCents: 150, netCents: 143, gstCents: 7 },
  { postedOn: "2025-01-05", kind: "meals", accountCode: "6100", label: "McDonald's", description: "MCDONALD'S #40888 CALGARY CAN", totalCents: 150, netCents: 143, gstCents: 7 },
  { postedOn: "2025-01-07", kind: "meals", accountCode: "6100", label: "Coco Fresh tea", description: "SQ *CAL - COCO FRESH T CALGARY CAN", totalCents: 1478, netCents: 1408, gstCents: 70 },
  { postedOn: "2025-01-08", kind: "meals", accountCode: "6100", label: "Domino's Pizza", description: "DOMINO'S PIZZA #1010 CALGARY CAN", totalCents: 3022, netCents: 2878, gstCents: 144 },
  { postedOn: "2025-01-08", kind: "nucleo", accountCode: "6050", label: "Nucleo Analytics marketing", description: "PAYPAL *NUCLEO 4029357733 CAN", totalCents: 46937, netCents: 46937, gstCents: 0 },
  { postedOn: "2025-01-11", kind: "msft", accountCode: "6020", label: "Microsoft 365", description: "Microsoft-G072375146 msbill.info CAN", totalCents: 1921, netCents: 1830, gstCents: 91 },
  { postedOn: "2025-01-14", kind: "meals", accountCode: "6100", label: "McDonald's", description: "MCDONALD'S #40408 CALGARY CAN", totalCents: 553, netCents: 527, gstCents: 26 },
  { postedOn: "2025-01-16", kind: "ctire", accountCode: "5100", label: "Canadian Tire shop supplies", description: "CANADIAN TIRE #419 CALGARY CAN", totalCents: 6298, netCents: 5998, gstCents: 300 },
  { postedOn: "2025-01-17", kind: "meals", accountCode: "6100", label: "Golden Beef Noodle", description: "GOLDEN BEEF NOODLE SOU CALGARY CAN", totalCents: 3806, netCents: 3625, gstCents: 181 },
  { postedOn: "2025-01-18", kind: "bambu", accountCode: "1600", label: "Bambu Lab 3D printer", description: "PPP*store bambulab com HongKong HKG", totalCents: 65514, netCents: 65514, gstCents: 0, ccaClass: "class8" },
  { postedOn: "2025-01-19", kind: "meals", accountCode: "6100", label: "Chicko Chicken", description: "CHICKO CHICKEN CALGARY CALGARY CAN", totalCents: 5700, netCents: 5429, gstCents: 271 },
  { postedOn: "2025-01-19", kind: "meals", accountCode: "6100", label: "John & Irish's", description: "JOHN & IRISHS' NF CALG CALGARY CAN", totalCents: 1020, netCents: 971, gstCents: 49 },
  { postedOn: "2025-01-20", kind: "meals", accountCode: "6100", label: "John & Irish's", description: "JOHN & IRISHS' NF CALG CALGARY CAN", totalCents: 3339, netCents: 3180, gstCents: 159 },
  { postedOn: "2025-01-21", kind: "meals", accountCode: "6100", label: "John & Irish's", description: "JOHN & IRISHS' NF CALG CALGARY CAN", totalCents: 491, netCents: 468, gstCents: 23 },
  { postedOn: "2025-01-22", kind: "meals", accountCode: "6100", label: "DoorDash DashPass", description: "DOORDASHDASHPASS +16506819470 CAN", totalCents: 524, netCents: 499, gstCents: 25 },
  { postedOn: "2025-01-22", kind: "homedepot", accountCode: "5100", label: "Home Depot shop supplies", description: "THE HOME DEPOT #7111 CALGARY CAN", totalCents: 3507, netCents: 3340, gstCents: 167 },
  { postedOn: "2025-01-23", kind: "homedepot", accountCode: "5100", label: "Home Depot shop supplies", description: "THE HOME DEPOT #7111 CALGARY CAN", totalCents: 4110, netCents: 3914, gstCents: 196 },
  { postedOn: "2025-01-24", kind: "homedepot", accountCode: "5100", label: "Home Depot shop supplies", description: "THE HOME DEPOT #7111 CALGARY CAN", totalCents: 3968, netCents: 3779, gstCents: 189 },
  { postedOn: "2025-01-26", kind: "adobe", accountCode: "6020", label: "Adobe Creative Cloud", description: "ADOBE *ADOBE SAN JOSE USA", totalCents: 1364, netCents: 1364, gstCents: 0 },
  { postedOn: "2025-01-31", kind: "meals", accountCode: "6100", label: "Gogi Korean BBQ", description: "GOGI KOREAN BBQ SUNRID CALGARY CAN", totalCents: 7360, netCents: 7010, gstCents: 350 },
  { postedOn: "2025-02-02", kind: "meals", accountCode: "6100", label: "John & Irish's", description: "JOHN & IRISHS' NF CALG CALGARY CAN", totalCents: 1158, netCents: 1103, gstCents: 55 },
  { postedOn: "2025-02-03", kind: "meals", accountCode: "6100", label: "John & Irish's", description: "JOHN & IRISHS' NF CALG CALGARY CAN", totalCents: 2304, netCents: 2194, gstCents: 110 },
  { postedOn: "2025-02-05", kind: "openai", accountCode: "6020", label: "OpenAI", description: "OPENAI +14158799686 USA (USD -21.63)", totalCents: 3104, netCents: 3104, gstCents: 0 },
  { postedOn: "2025-02-08", kind: "meals", accountCode: "6100", label: "John & Irish's", description: "JOHN & IRISHS' NF CALG CALGARY CAN", totalCents: 2348, netCents: 2236, gstCents: 112 },
  { postedOn: "2025-02-08", kind: "meals", accountCode: "6100", label: "John & Irish's", description: "JOHN & IRISHS' NF CALG CALGARY CAN", totalCents: 418, netCents: 398, gstCents: 20 },
  { postedOn: "2025-02-08", kind: "meals", accountCode: "6100", label: "John & Irish's", description: "JOHN & IRISHS' NF CALG CALGARY CAN", totalCents: 400, netCents: 381, gstCents: 19 },
  { postedOn: "2025-02-11", kind: "msft", accountCode: "6020", label: "Microsoft 365", description: "Microsoft-G076718437 msbill.info CAN", totalCents: 1921, netCents: 1830, gstCents: 91 },
  { postedOn: "2025-02-12", kind: "meals", accountCode: "6100", label: "Bourbon St Grill", description: "BOURBON ST GRILL ROCKY VIEW CO CAN", totalCents: 1877, netCents: 1788, gstCents: 89 },
  { postedOn: "2025-02-13", kind: "meals", accountCode: "6100", label: "John & Irish's", description: "JOHN & IRISHS' NF CALG CALGARY CAN", totalCents: 749, netCents: 713, gstCents: 36 },
  { postedOn: "2025-02-13", kind: "nucleo", accountCode: "6050", label: "Nucleo Analytics marketing", description: "PAYPAL *NUCLEOANALY 4029357733 SGP", totalCents: 1235, netCents: 1235, gstCents: 0 },
  { postedOn: "2025-02-15", kind: "meals", accountCode: "6100", label: "McDonald's", description: "MCDONALD'S #40408 CALGARY CAN", totalCents: 599, netCents: 570, gstCents: 29 },
  { postedOn: "2025-02-16", kind: "meals", accountCode: "6100", label: "Shawarma Palace", description: "SHAWARMA PALACE CARRIN CALGARY CAN", totalCents: 3147, netCents: 2997, gstCents: 150 },
  { postedOn: "2025-02-21", kind: "homedepot", accountCode: "5100", label: "Home Depot shop supplies", description: "PAYPAL *HOMEDEPOTCA 4029357733 CAN", totalCents: 31628, netCents: 30122, gstCents: 1506 },
  { postedOn: "2025-02-21", kind: "homedepot", accountCode: "5100", label: "Home Depot shop supplies", description: "THE HOME DEPOT #7037 CALGARY CAN", totalCents: 501, netCents: 477, gstCents: 24 },
  { postedOn: "2025-02-21", kind: "homedepot", accountCode: "5100", label: "Home Depot shop supplies", description: "THE HOME DEPOT #7037 CALGARY CAN", totalCents: 9010, netCents: 8581, gstCents: 429 },
  { postedOn: "2025-02-22", kind: "meals", accountCode: "6100", label: "DoorDash DashPass", description: "DOORDASHDASHPASS +16506819470 CAN", totalCents: 524, netCents: 499, gstCents: 25 },
  { postedOn: "2025-02-22", kind: "rona", accountCode: "5100", label: "Rona shop supplies", description: "RONA CALGARY 62860 CALGARY CAN", totalCents: 5996, netCents: 5710, gstCents: 286 },
  { postedOn: "2025-02-24", kind: "rona", accountCode: "5100", label: "Rona shop supplies", description: "RONA CALGARY 62860 CALGARY CAN", totalCents: 9900, netCents: 9429, gstCents: 471 },
  { postedOn: "2025-02-25", kind: "meals", accountCode: "6100", label: "McDonald's", description: "MCDONALD'S #6617 CALGARY CAN", totalCents: 366, netCents: 349, gstCents: 17 },
  { postedOn: "2025-02-25", kind: "blanks", accountCode: "5000", label: "S&S Activewear blanks", description: "S&S ACTIVEWEAR CANADA MONTREAL CAN", totalCents: 6688, netCents: 6370, gstCents: 318 },
  { postedOn: "2025-02-25", kind: "homedepot", accountCode: "5100", label: "Home Depot shop supplies", description: "THE HOME DEPOT #7111 CALGARY CAN", totalCents: 16710, netCents: 15914, gstCents: 796 },
  { postedOn: "2025-02-26", kind: "adobe", accountCode: "6020", label: "Adobe Creative Cloud", description: "Adobe San Jose USA", totalCents: 1364, netCents: 1364, gstCents: 0 },
  { postedOn: "2025-02-26", kind: "ctire", accountCode: "5100", label: "Canadian Tire shop supplies", description: "CANADIAN TIRE #419 CALGARY CAN", totalCents: 1049, netCents: 999, gstCents: 50 },
  { postedOn: "2025-02-27", kind: "homedepot", accountCode: "5100", label: "Home Depot shop supplies", description: "THE HOME DEPOT #7111 CALGARY CAN", totalCents: 1496, netCents: 1425, gstCents: 71 },
  { postedOn: "2025-03-03", kind: "blanks", accountCode: "5000", label: "S&S Activewear blanks", description: "S&S ACTIVEWEAR CANADA MONTREAL CAN", totalCents: 5981, netCents: 5696, gstCents: 285 },
  { postedOn: "2025-03-04", kind: "meals", accountCode: "6100", label: "Wow Cafe & Bakery", description: "WOW BAKERY CHINOOK CEN CALGARY CAN", totalCents: 1596, netCents: 1520, gstCents: 76 },
  { postedOn: "2025-03-05", kind: "blanks", accountCode: "5000", label: "S&S Activewear blanks", description: "S&S ACTIVEWEAR CANADA MONTREAL CAN", totalCents: 2814, netCents: 2680, gstCents: 134 },
  { postedOn: "2025-03-06", kind: "blanks", accountCode: "5000", label: "S&S Activewear blanks", description: "S&S ACTIVEWEAR CANADA MONTREAL CAN", totalCents: 92647, netCents: 88235, gstCents: 4412 },
  { postedOn: "2025-03-08", kind: "meals", accountCode: "6100", label: "John & Irish's", description: "JOHN & IRISHS' NF CALG CALGARY CAN", totalCents: 613, netCents: 584, gstCents: 29 },
  { postedOn: "2025-03-08", kind: "blanks", accountCode: "5000", label: "S&S Activewear blanks", description: "S&S ACTIVEWEAR CANADA MONTREAL CAN", totalCents: 1828, netCents: 1741, gstCents: 87 },
  { postedOn: "2025-03-08", kind: "homedepot", accountCode: "5100", label: "Home Depot shop supplies", description: "THE HOME DEPOT #7111 CALGARY CAN", totalCents: 1625, netCents: 1548, gstCents: 77 },
  { postedOn: "2025-03-09", kind: "nucleo", accountCode: "6050", label: "Nucleo Analytics marketing", description: "PAYPAL *NUCLEOANALY 09592097054 SGP", totalCents: 34310, netCents: 34310, gstCents: 0 },
  { postedOn: "2025-03-10", kind: "msft", accountCode: "6020", label: "Microsoft 365", description: "MICROSOFT#G080692196 MISSISSAUGA CAN", totalCents: 1921, netCents: 1830, gstCents: 91 },
  { postedOn: "2025-03-10", kind: "blanks", accountCode: "5000", label: "S&S Activewear blanks", description: "S&S ACTIVEWEAR CANADA MONTREAL CAN", totalCents: 2373, netCents: 2260, gstCents: 113 },
  { postedOn: "2025-03-13", kind: "blanks", accountCode: "5000", label: "S&S Activewear blanks", description: "S&S ACTIVEWEAR CANADA MONTREAL CAN", totalCents: 4617, netCents: 4397, gstCents: 220 },
  { postedOn: "2025-03-14", kind: "meals", accountCode: "6100", label: "Noodle King", description: "NOODLE KING CALGARY CAN", totalCents: 2246, netCents: 2139, gstCents: 107 },
  { postedOn: "2025-03-14", kind: "blanks", accountCode: "5000", label: "S&S Activewear blanks", description: "S&S ACTIVEWEAR CANADA MONTREAL CAN", totalCents: 1294, netCents: 1232, gstCents: 62 },
  { postedOn: "2025-03-16", kind: "meals", accountCode: "6100", label: "John & Irish's", description: "JOHN & IRISHS' NF CALG CALGARY CAN", totalCents: 856, netCents: 815, gstCents: 41 },
  { postedOn: "2025-03-17", kind: "meals", accountCode: "6100", label: "Krispy Kreme", description: "KRISPYKREMEEDMONTON5 EDMONTON CAN", totalCents: 3263, netCents: 3108, gstCents: 155 },
  { postedOn: "2025-03-18", kind: "meals", accountCode: "6100", label: "McDonald's", description: "MCDONALD'S #40888 CALGARY CAN", totalCents: 612, netCents: 583, gstCents: 29 },
  { postedOn: "2025-03-18", kind: "blanks", accountCode: "5000", label: "S&S Activewear blanks", description: "S&S ACTIVEWEAR CANADA MONTREAL CAN", totalCents: 6862, netCents: 6535, gstCents: 327 },
  { postedOn: "2025-03-21", kind: "blanks", accountCode: "5000", label: "S&S Activewear blanks", description: "S&S ACTIVEWEAR CANADA MONTREAL CAN", totalCents: 12723, netCents: 12117, gstCents: 606 },
  { postedOn: "2025-03-21", kind: "xai", accountCode: "6020", label: "xAI", description: "XAI LLC +18002698161 USA (USD -30.90)", totalCents: 4442, netCents: 4442, gstCents: 0 },
  { postedOn: "2025-03-22", kind: "meals", accountCode: "6100", label: "DoorDash DashPass", description: "DOORDASHDASHPASS +16506819470 CAN", totalCents: 524, netCents: 499, gstCents: 25 },
  { postedOn: "2025-03-23", kind: "meals", accountCode: "6100", label: "McDonald's", description: "MCDONALD'S #40408 CALGARY CAN", totalCents: 587, netCents: 559, gstCents: 28 },
  { postedOn: "2025-03-26", kind: "adobe", accountCode: "6020", label: "Adobe Creative Cloud", description: "Adobe San Jose USA", totalCents: 1364, netCents: 1364, gstCents: 0 },
  { postedOn: "2025-03-30", kind: "meals", accountCode: "6100", label: "John & Irish's", description: "JOHN & IRISHS' NF CALG CALGARY CAN", totalCents: 443, netCents: 422, gstCents: 21 },
  { postedOn: "2025-03-31", kind: "meals", accountCode: "6100", label: "Coco Fresh tea", description: "SQ *CAL - COCO FRESH T Calgary CAN", totalCents: 719, netCents: 685, gstCents: 34 },
  { postedOn: "2025-04-07", kind: "blanks", accountCode: "5000", label: "S&S Activewear blanks", description: "S&S ACTIVEWEAR CANADA MONTREAL CAN", totalCents: 3706, netCents: 3530, gstCents: 176 },
  { postedOn: "2025-04-08", kind: "meals", accountCode: "6100", label: "John & Irish's", description: "JOHN & IRISHS' NF CALG CALGARY CAN", totalCents: 1588, netCents: 1512, gstCents: 76 },
  { postedOn: "2025-04-10", kind: "homedepot", accountCode: "5100", label: "Home Depot shop supplies", description: "THE HOME DEPOT #7111 CALGARY CAN", totalCents: 338, netCents: 322, gstCents: 16 },
  { postedOn: "2025-04-11", kind: "blackmagic", accountCode: "6020", label: "Blackmagic Cloud", description: "BLACKMAGIC CLOUD +14089540500 USA", totalCents: 1103, netCents: 1103, gstCents: 0 },
  { postedOn: "2025-04-11", kind: "msft", accountCode: "6020", label: "Microsoft 365", description: "MICROSOFT#G085295560 MISSISSAUGA CAN", totalCents: 1921, netCents: 1830, gstCents: 91 },
  { postedOn: "2025-04-11", kind: "homedepot", accountCode: "5100", label: "Home Depot shop supplies", description: "THE HOME DEPOT #7111 CALGARY CAN", totalCents: 2090, netCents: 1990, gstCents: 100 },
  { postedOn: "2025-04-13", kind: "meals", accountCode: "6100", label: "John & Irish's", description: "JOHN & IRISHS' NF CALG CALGARY CAN", totalCents: 124, netCents: 118, gstCents: 6 },
  { postedOn: "2025-04-14", kind: "nucleo", accountCode: "6050", label: "Nucleo Analytics marketing", description: "PAYPAL *NUCLEOANALY 4029357733 SGP", totalCents: 17928, netCents: 17928, gstCents: 0 },
  { postedOn: "2025-04-15", kind: "meals", accountCode: "6100", label: "McDonald's", description: "MCDONALD'S #40408 CALGARY CAN", totalCents: 131, netCents: 125, gstCents: 6 },
  { postedOn: "2025-04-16", kind: "eleven", accountCode: "6020", label: "ElevenLabs", description: "ELEVENLABS.IO +19177203691 USA (USD -11.89)", totalCents: 1663, netCents: 1663, gstCents: 0 },
  { postedOn: "2025-04-18", kind: "rona", accountCode: "5100", label: "Rona shop supplies", description: "RONA+ CROSSIRON 88007 ROCKY VIEW CO CAN", totalCents: 14375, netCents: 13690, gstCents: 685 },
  { postedOn: "2025-04-20", kind: "meals", accountCode: "6100", label: "Gangnam Coco", description: "LS gangnamcoco red deer coun CAN", totalCents: 3638, netCents: 3465, gstCents: 173 },
  { postedOn: "2025-04-20", kind: "meals", accountCode: "6100", label: "McDonald's", description: "MCDONALD'S #6617 CALGARY CAN", totalCents: 523, netCents: 498, gstCents: 25 },
  { postedOn: "2025-04-22", kind: "meals", accountCode: "6100", label: "DoorDash DashPass", description: "DOORDASHDASHPASS +16506819470 CAN", totalCents: 524, netCents: 499, gstCents: 25 },
  { postedOn: "2025-04-22", kind: "meals", accountCode: "6100", label: "McDonald's", description: "MCDONALD'S #40888 CALGARY CAN", totalCents: 691, netCents: 658, gstCents: 33 },
  { postedOn: "2025-04-26", kind: "adobe", accountCode: "6020", label: "Adobe Creative Cloud", description: "Adobe Inc San Jose USA", totalCents: 1364, netCents: 1364, gstCents: 0 },
  { postedOn: "2025-04-27", kind: "meals", accountCode: "6100", label: "John & Irish's", description: "JOHN & IRISHS' NF CALG CALGARY CAN", totalCents: 3998, netCents: 3808, gstCents: 190 },
  { postedOn: "2025-04-29", kind: "meals", accountCode: "6100", label: "McDonald's", description: "MCDONALD'S #40408 CALGARY CAN", totalCents: 158, netCents: 150, gstCents: 8 },
  { postedOn: "2025-05-05", kind: "meals", accountCode: "6100", label: "John & Irish's", description: "JOHN & IRISHS' NF CALG CALGARY CAN", totalCents: 298, netCents: 284, gstCents: 14 },
  { postedOn: "2025-05-05", kind: "msft", accountCode: "6020", label: "Microsoft 365", description: "MICROSOFT#G089968986 MISSISSAUGA CAN", totalCents: 1921, netCents: 1830, gstCents: 91 },
  { postedOn: "2025-05-06", kind: "blanks", accountCode: "5000", label: "S&S Activewear blanks", description: "S&S ACTIVEWEAR CANADA MONTREAL CAN", totalCents: 4282, netCents: 4078, gstCents: 204 },
  { postedOn: "2025-05-10", kind: "meals", accountCode: "6100", label: "Dairy Queen", description: "DAIRY QUEEN #27231 CALGARY CAN", totalCents: 3699, netCents: 3523, gstCents: 176 },
  { postedOn: "2025-05-11", kind: "blackmagic", accountCode: "6020", label: "Blackmagic Cloud", description: "BLACKMAGIC CLOUD +14089540500 USA", totalCents: 1103, netCents: 1103, gstCents: 0 },
  { postedOn: "2025-05-15", kind: "meals", accountCode: "6100", label: "John & Irish's", description: "JOHN & IRISHS' NF CALG CALGARY CAN", totalCents: 3579, netCents: 3409, gstCents: 170 },
  { postedOn: "2025-05-15", kind: "meals", accountCode: "6100", label: "Tim Hortons", description: "TIM HORTONS #5029 CALGARY CAN", totalCents: 580, netCents: 552, gstCents: 28 },
  { postedOn: "2025-05-16", kind: "eleven", accountCode: "6020", label: "ElevenLabs", description: "ELEVENLABS.IO +19177203691 USA (USD -23.79)", totalCents: 3333, netCents: 3333, gstCents: 0 },
  { postedOn: "2025-05-22", kind: "meals", accountCode: "6100", label: "DoorDash DashPass", description: "DOORDASHDASHPASS +16506819470 CAN", totalCents: 524, netCents: 499, gstCents: 25 },
  { postedOn: "2025-05-22", kind: "blanks", accountCode: "5000", label: "S&S Activewear blanks", description: "S&S ACTIVEWEAR CANADA MONTREAL CAN", totalCents: 3227, netCents: 3073, gstCents: 154 },
  { postedOn: "2025-05-24", kind: "trexity", accountCode: "5040", label: "Trexity freight", description: "TREXITY +13433125644 CAN", totalCents: 1260, netCents: 1200, gstCents: 60 },
  { postedOn: "2025-05-25", kind: "meals", accountCode: "6100", label: "John & Irish's", description: "JOHN & IRISHS' NF CALG CALGARY CAN", totalCents: 500, netCents: 476, gstCents: 24 },
  { postedOn: "2025-05-26", kind: "adobe", accountCode: "6020", label: "Adobe Creative Cloud", description: "Adobe San Jose USA", totalCents: 1364, netCents: 1364, gstCents: 0 },
  { postedOn: "2025-05-27", kind: "ctire", accountCode: "5100", label: "Canadian Tire shop supplies", description: "CANADIAN TIRE #419 CALGARY CAN", totalCents: 4199, netCents: 3999, gstCents: 200 },
  { postedOn: "2025-05-27", kind: "blanks", accountCode: "5000", label: "S&S Activewear blanks", description: "S&S ACTIVEWEAR CANADA MONTREAL CAN", totalCents: 4146, netCents: 3949, gstCents: 197 },
  { postedOn: "2025-05-31", kind: "blackforest", accountCode: "6020", label: "Black Forest Labs", description: "BLACK FOREST LABS +16502838796 USA", totalCents: 1426, netCents: 1426, gstCents: 0 },
  { postedOn: "2025-06-04", kind: "msft", accountCode: "6020", label: "Microsoft 365", description: "Microsoft-G094127283 msbill.info CAN", totalCents: 2017, netCents: 1921, gstCents: 96 },
  { postedOn: "2025-06-06", kind: "meta", accountCode: "6050", label: "Meta ads", description: "PP*METAPLATFOR 4029357733 USA", totalCents: 10500, netCents: 10500, gstCents: 0 },
  { postedOn: "2025-06-08", kind: "meta", accountCode: "6050", label: "Meta ads", description: "PP*METAPLATFOR 4029357733 USA", totalCents: 10500, netCents: 10500, gstCents: 0 },
  { postedOn: "2025-06-09", kind: "meals", accountCode: "6100", label: "Jerusalem Shawarma", description: "JERUSALEM SHAWARMA CALGARY CAN", totalCents: 3665, netCents: 3490, gstCents: 175 },
  { postedOn: "2025-06-09", kind: "meals", accountCode: "6100", label: "McDonald's", description: "MCDONALD'S #9115 CALGARY CAN", totalCents: 146, netCents: 139, gstCents: 7 },
  { postedOn: "2025-06-09", kind: "blanks", accountCode: "5000", label: "S&S Activewear blanks", description: "S&S ACTIVEWEAR CANADA MONTREAL CAN", totalCents: 8998, netCents: 8570, gstCents: 428 },
  { postedOn: "2025-06-11", kind: "blackmagic", accountCode: "6020", label: "Blackmagic Cloud", description: "BLACKMAGIC CLOUD +14089540500 USA", totalCents: 1103, netCents: 1103, gstCents: 0 },
  { postedOn: "2025-06-11", kind: "blanks", accountCode: "5000", label: "S&S Activewear blanks", description: "S&S ACTIVEWEAR CANADA MONTREAL CAN", totalCents: 14580, netCents: 13886, gstCents: 694 },
  { postedOn: "2025-06-13", kind: "meals", accountCode: "6100", label: "Happy Lamb Hot Pot", description: "HAPPY LAMB HOT POT CALGARY CAN", totalCents: 7288, netCents: 6941, gstCents: 347 },
  { postedOn: "2025-06-13", kind: "meals", accountCode: "6100", label: "John & Irish's", description: "JOHN & IRISHS' NF CALG CALGARY CAN", totalCents: 300, netCents: 286, gstCents: 14 },
  { postedOn: "2025-06-15", kind: "meals", accountCode: "6100", label: "John & Irish's", description: "JOHN & IRISHS' NF CALG CALGARY CAN", totalCents: 1517, netCents: 1445, gstCents: 72 },
  { postedOn: "2025-06-16", kind: "eleven", accountCode: "6020", label: "ElevenLabs", description: "ELEVENLABS.IO +19177203691 USA (USD -23.79)", totalCents: 3238, netCents: 3238, gstCents: 0 },
  { postedOn: "2025-06-18", kind: "ups", accountCode: "5040", label: "UPS freight", description: "UPS CALGARY SOUTH 7436 CALGARY CAN", totalCents: 3813, netCents: 3631, gstCents: 182 },
  { postedOn: "2025-06-19", kind: "blanks", accountCode: "5000", label: "S&S Activewear blanks", description: "S&S ACTIVEWEAR CANADA MONTREAL CAN", totalCents: 7704, netCents: 7337, gstCents: 367 },
  { postedOn: "2025-06-22", kind: "meals", accountCode: "6100", label: "Domino's Pizza", description: "DOMINO'S PIZZA #1018 CALGARY CAN", totalCents: 682, netCents: 650, gstCents: 32 },
  { postedOn: "2025-06-22", kind: "meals", accountCode: "6100", label: "DoorDash DashPass", description: "DOORDASHDASHPASS DOWNTOWN TORO CAN", totalCents: 524, netCents: 499, gstCents: 25 },
  { postedOn: "2025-06-23", kind: "meals", accountCode: "6100", label: "Jerusalem Shawarma", description: "JERUSALEM SHAWARMA CALGARY CAN", totalCents: 3665, netCents: 3490, gstCents: 175 },
  { postedOn: "2025-06-23", kind: "meals", accountCode: "6100", label: "John & Irish's", description: "JOHN & IRISHS' NF CALG CALGARY CAN", totalCents: 2027, netCents: 1930, gstCents: 97 },
  { postedOn: "2025-06-25", kind: "nucleo", accountCode: "6050", label: "Nucleo Analytics marketing", description: "PAYPAL *NUCLEOANALY 09592097054 SGP", totalCents: 21091, netCents: 21091, gstCents: 0 },
  { postedOn: "2025-06-26", kind: "adobe", accountCode: "6020", label: "Adobe Creative Cloud", description: "Adobe San Jose USA", totalCents: 1364, netCents: 1364, gstCents: 0 },
  { postedOn: "2025-06-26", kind: "meals", accountCode: "6100", label: "Tim Hortons", description: "TIM HORTONS #2949 CALGARY CAN", totalCents: 230, netCents: 219, gstCents: 11 },
  { postedOn: "2025-06-28", kind: "meals", accountCode: "6100", label: "John & Irish's", description: "JOHN & IRISHS' NF CALG CALGARY CAN", totalCents: 1077, netCents: 1026, gstCents: 51 },
  { postedOn: "2025-06-29", kind: "meta", accountCode: "6050", label: "Meta ads", description: "PP*METAPLATFOR 4029357733 USA", totalCents: 11550, netCents: 11550, gstCents: 0 },
  { postedOn: "2025-07-02", kind: "meals", accountCode: "6100", label: "John & Irish's", description: "JOHN & IRISHS' NF CALG CALGARY CAN", totalCents: 2974, netCents: 2832, gstCents: 142 },
  { postedOn: "2025-07-02", kind: "blanks", accountCode: "5000", label: "S&S Activewear blanks", description: "S&S ACTIVEWEAR CANADA MONTREAL CAN", totalCents: 35262, netCents: 33583, gstCents: 1679 },
  { postedOn: "2025-07-03", kind: "msft", accountCode: "6020", label: "Microsoft 365", description: "MICROSOFT#G099157933 MISSISSAUGA CAN", totalCents: 2017, netCents: 1921, gstCents: 96 },
  { postedOn: "2025-07-03", kind: "nucleo", accountCode: "6050", label: "Nucleo Analytics marketing", description: "PAYPAL *NUCLEOANALY 09592097054 SGP", totalCents: 49667, netCents: 49667, gstCents: 0 },
  { postedOn: "2025-07-07", kind: "homedepot", accountCode: "5100", label: "Home Depot shop supplies", description: "PAYPAL *HOMEDEPOTCA 4029357733 CAN", totalCents: 16590, netCents: 15800, gstCents: 790 },
  { postedOn: "2025-07-07", kind: "blanks", accountCode: "5000", label: "S&S Activewear blanks", description: "S&S ACTIVEWEAR CANADA MONTREAL CAN", totalCents: 7130, netCents: 6790, gstCents: 340 },
  { postedOn: "2025-07-08", kind: "meals", accountCode: "6100", label: "Marchant Concessions", description: "MARCHANT CONCESSIONS PENTICTON CAN", totalCents: 700, netCents: 667, gstCents: 33 },
  { postedOn: "2025-07-08", kind: "meals", accountCode: "6100", label: "Pho Hoan Pasteur", description: "PHO HOAN PASTEUR CALGARY CAN", totalCents: 1993, netCents: 1898, gstCents: 95 },
  { postedOn: "2025-07-10", kind: "meals", accountCode: "6100", label: "Tim Hortons", description: "TIM HORTONS #0240 TORONTO CAN", totalCents: 230, netCents: 219, gstCents: 11 },
  { postedOn: "2025-07-10", kind: "ups", accountCode: "5040", label: "UPS freight", description: "UPS CALGARY SOUTH 7436 CALGARY CAN", totalCents: 4653, netCents: 4431, gstCents: 222 },
  { postedOn: "2025-07-11", kind: "blackmagic", accountCode: "6020", label: "Blackmagic Cloud", description: "BLACKMAGIC CLOUD FREMONT USA", totalCents: 1103, netCents: 1103, gstCents: 0 },
  { postedOn: "2025-07-13", kind: "meals", accountCode: "6100", label: "John & Irish's", description: "JOHN & IRISHS' NF CALG CALGARY CAN", totalCents: 1276, netCents: 1215, gstCents: 61 },
  { postedOn: "2025-07-14", kind: "chitchats", accountCode: "5040", label: "Chit Chats freight", description: "CHIT CHATS VANCOUVER CAN", totalCents: 2600, netCents: 2476, gstCents: 124 },
  { postedOn: "2025-07-14", kind: "meals", accountCode: "6100", label: "John & Irish's", description: "JOHN & IRISHS' NF CALG CALGARY CAN", totalCents: 1799, netCents: 1713, gstCents: 86 },
  { postedOn: "2025-07-14", kind: "meals", accountCode: "6100", label: "Tim Hortons", description: "TIM HORTONS #2949 CALGARY CAN", totalCents: 230, netCents: 219, gstCents: 11 },
  { postedOn: "2025-07-16", kind: "eleven", accountCode: "6020", label: "ElevenLabs", description: "ELEVENLABS.IO NEW YORK USA (USD -23.79)", totalCents: 3273, netCents: 3273, gstCents: 0 },
  { postedOn: "2025-07-18", kind: "meals", accountCode: "6100", label: "John & Irish's", description: "JOHN & IRISHS' NF CALG CALGARY CAN", totalCents: 550, netCents: 524, gstCents: 26 },
  { postedOn: "2025-07-19", kind: "meals", accountCode: "6100", label: "John & Irish's", description: "JOHN & IRISHS' NF CALG CALGARY CAN", totalCents: 2066, netCents: 1968, gstCents: 98 },
  { postedOn: "2025-07-21", kind: "meals", accountCode: "6100", label: "John & Irish's", description: "JOHN & IRISHS' NF CALG CALGARY CAN", totalCents: 1919, netCents: 1828, gstCents: 91 },
  { postedOn: "2025-07-22", kind: "cursor", accountCode: "6020", label: "Cursor IDE", description: "CURSOR, AI POWERED IDE NEW YORK USA (USD", totalCents: 2822, netCents: 2822, gstCents: 0 },
  { postedOn: "2025-07-22", kind: "meals", accountCode: "6100", label: "DoorDash DashPass", description: "DOORDASHDASHPASS DOWNTOWN TORO CAN", totalCents: 524, netCents: 499, gstCents: 25 },
  { postedOn: "2025-07-22", kind: "meals", accountCode: "6100", label: "Shawarma Palace", description: "SHAWARMA PALACE CARRIN CALGARY CAN", totalCents: 3883, netCents: 3698, gstCents: 185 },
  { postedOn: "2025-07-23", kind: "ctire", accountCode: "5100", label: "Canadian Tire shop supplies", description: "CANADIAN TIRE #419 CALGARY CAN", totalCents: 2204, netCents: 2099, gstCents: 105 },
  { postedOn: "2025-07-23", kind: "blanks", accountCode: "5000", label: "S&S Activewear blanks", description: "S&S ACTIVEWEAR CANADA MONTREAL CAN", totalCents: 9456, netCents: 9006, gstCents: 450 },
  { postedOn: "2025-07-24", kind: "cursor", accountCode: "6020", label: "Cursor IDE", description: "CURSOR USAGE MID JUL NEW YORK USA (USD", totalCents: 2811, netCents: 2811, gstCents: 0 },
  { postedOn: "2025-07-25", kind: "cursor", accountCode: "6020", label: "Cursor IDE", description: "CURSOR USAGE MID JUL NEW YORK USA (USD", totalCents: 5652, netCents: 5652, gstCents: 0 },
  { postedOn: "2025-07-26", kind: "adobe", accountCode: "6020", label: "Adobe Creative Cloud", description: "Adobe San Jose USA", totalCents: 1364, netCents: 1364, gstCents: 0 },
  { postedOn: "2025-07-26", kind: "rona", accountCode: "5100", label: "Rona shop supplies", description: "RONA CALGARY 62860 CALGARY CAN", totalCents: 4983, netCents: 4746, gstCents: 237 },
  { postedOn: "2025-07-27", kind: "meals", accountCode: "6100", label: "John & Irish's", description: "JOHN & IRISHS' NF CALG CALGARY CAN", totalCents: 2448, netCents: 2331, gstCents: 117 },
  { postedOn: "2025-07-29", kind: "cursor", accountCode: "6020", label: "Cursor IDE", description: "CURSOR USAGE MID JUL NEW YORK USA (USD", totalCents: 8509, netCents: 8509, gstCents: 0 },
  { postedOn: "2025-07-29", kind: "meals", accountCode: "6100", label: "John & Irish's", description: "JOHN & IRISHS' NF CALG CALGARY CAN", totalCents: 964, netCents: 918, gstCents: 46 },
  { postedOn: "2025-07-31", kind: "meals", accountCode: "6100", label: "John & Irish's", description: "JOHN & IRISHS' NF CALG CALGARY CAN", totalCents: 279, netCents: 266, gstCents: 13 },
  { postedOn: "2025-07-31", kind: "purolator", accountCode: "5040", label: "Purolator freight", description: "PUROLATOR #60715 CALGARY CAN", totalCents: 1922, netCents: 1830, gstCents: 92 },
  { postedOn: "2025-08-01", kind: "nucleo", accountCode: "6050", label: "Nucleo Analytics marketing", description: "PAYPAL *NUCLEOANALY 09592097054 SGP", totalCents: 10299, netCents: 10299, gstCents: 0 },
  { postedOn: "2025-08-02", kind: "meals", accountCode: "6100", label: "bb.q Chicken", description: "BB.Q CHICKEN NOLAN HIL CALGARY CAN", totalCents: 2536, netCents: 2415, gstCents: 121 },
  { postedOn: "2025-08-03", kind: "msft", accountCode: "6020", label: "Microsoft 365", description: "Microsoft-G104260525 msbill.info CAN", totalCents: 2017, netCents: 1921, gstCents: 96 },
  { postedOn: "2025-08-05", kind: "cursor", accountCode: "6020", label: "Cursor IDE", description: "CURSOR USAGE JUL NEW YORK USA (USD -10.20)", totalCents: 1408, netCents: 1408, gstCents: 0 },
  { postedOn: "2025-08-06", kind: "meals", accountCode: "6100", label: "John & Irish's", description: "JOHN & IRISHS' NF CALG CALGARY CAN", totalCents: 2806, netCents: 2672, gstCents: 134 },
  { postedOn: "2025-08-06", kind: "blanks", accountCode: "5000", label: "S&S Activewear blanks", description: "S&S ACTIVEWEAR CANADA MONTREAL CAN", totalCents: 3115, netCents: 2967, gstCents: 148 },
  { postedOn: "2025-08-07", kind: "chitchats", accountCode: "5040", label: "Chit Chats freight", description: "CHIT CHATS VANCOUVER CAN", totalCents: 3000, netCents: 2857, gstCents: 143 },
  { postedOn: "2025-08-11", kind: "blackmagic", accountCode: "6020", label: "Blackmagic Cloud", description: "BLACKMAGIC CLOUD FREMONT USA", totalCents: 1103, netCents: 1103, gstCents: 0 },
  { postedOn: "2025-08-16", kind: "eleven", accountCode: "6020", label: "ElevenLabs", description: "ELEVENLABS.IO NEW YORK USA (USD -23.79)", totalCents: 3289, netCents: 3289, gstCents: 0 },
  { postedOn: "2025-08-16", kind: "meals", accountCode: "6100", label: "John & Irish's", description: "JOHN & IRISHS' NF CALG CALGARY CAN", totalCents: 1815, netCents: 1729, gstCents: 86 },
  { postedOn: "2025-08-17", kind: "meals", accountCode: "6100", label: "John & Irish's", description: "JOHN & IRISHS' NF CALG CALGARY CAN", totalCents: 198, netCents: 189, gstCents: 9 },
  { postedOn: "2025-08-17", kind: "meals", accountCode: "6100", label: "Wendy's", description: "WENDY'S MCKNIGHT CALGARY CAN", totalCents: 387, netCents: 369, gstCents: 18 },
  { postedOn: "2025-08-18", kind: "meals", accountCode: "6100", label: "John & Irish's", description: "JOHN & IRISHS' NF CALG CALGARY CAN", totalCents: 575, netCents: 548, gstCents: 27 },
  { postedOn: "2025-08-18", kind: "meals", accountCode: "6100", label: "John & Irish's", description: "JOHN & IRISHS' NF CALG CALGARY CAN", totalCents: 615, netCents: 586, gstCents: 29 },
  { postedOn: "2025-08-22", kind: "cursor", accountCode: "6020", label: "Cursor IDE", description: "CURSOR, AI POWERED IDE NEW YORK USA (USD", totalCents: 2870, netCents: 2870, gstCents: 0 },
  { postedOn: "2025-08-22", kind: "meals", accountCode: "6100", label: "DoorDash DashPass", description: "DOORDASHDASHPASS DOWNTOWN TORO CAN", totalCents: 524, netCents: 499, gstCents: 25 },
  { postedOn: "2025-08-22", kind: "meals", accountCode: "6100", label: "John & Irish's", description: "JOHN & IRISHS' NF CALG CALGARY CAN", totalCents: 1854, netCents: 1766, gstCents: 88 },
  { postedOn: "2025-08-23", kind: "metal", accountCode: "5100", label: "Calgary Metal Market", description: "CALGARY METAL MARKET CALGARY CAN", totalCents: 2625, netCents: 2500, gstCents: 125 },
  { postedOn: "2025-08-24", kind: "meals", accountCode: "6100", label: "Shawarma Palace", description: "SHAWARMA PALACE CARRIN CALGARY CAN", totalCents: 1259, netCents: 1199, gstCents: 60 },
  { postedOn: "2025-08-25", kind: "uline", accountCode: "5100", label: "Uline packing supplies", description: "ULINE 800-295-5510 CAN", totalCents: 37080, netCents: 35314, gstCents: 1766 },
  { postedOn: "2025-08-26", kind: "adobe", accountCode: "6020", label: "Adobe Creative Cloud", description: "Adobe San Jose USA", totalCents: 1364, netCents: 1364, gstCents: 0 },
  { postedOn: "2025-08-31", kind: "meals", accountCode: "6100", label: "John & Irish's", description: "JOHN & IRISHS' NF CALG CALGARY CAN", totalCents: 639, netCents: 609, gstCents: 30 },
  { postedOn: "2025-09-01", kind: "meals", accountCode: "6100", label: "John & Irish's", description: "JOHN & IRISHS' NF CALG CALGARY CAN", totalCents: 600, netCents: 571, gstCents: 29 },
  { postedOn: "2025-09-02", kind: "ups", accountCode: "5040", label: "UPS freight", description: "UPS CALGARY SOUTH 7436 CALGARY CAN", totalCents: 3100, netCents: 2952, gstCents: 148 },
  { postedOn: "2025-09-03", kind: "meals", accountCode: "6100", label: "John & Irish's", description: "JOHN & IRISHS' NF CALG CALGARY CAN", totalCents: 1960, netCents: 1867, gstCents: 93 },
  { postedOn: "2025-09-03", kind: "nucleo", accountCode: "6050", label: "Nucleo Analytics marketing", description: "PAYPAL *NUCLEOANALY 09592097054 SGP", totalCents: 32300, netCents: 32300, gstCents: 0 },
  { postedOn: "2025-09-04", kind: "msft", accountCode: "6020", label: "Microsoft 365", description: "Microsoft-G109835334 msbill.info CAN", totalCents: 2017, netCents: 1921, gstCents: 96 },
  { postedOn: "2025-09-04", kind: "rona", accountCode: "5100", label: "Rona shop supplies", description: "RONA CALGARY 62860 CALGARY CAN", totalCents: 3777, netCents: 3597, gstCents: 180 },
  { postedOn: "2025-09-06", kind: "cursor", accountCode: "6020", label: "Cursor IDE", description: "CURSOR USAGE AUG NEW YORK USA (USD -13.64)", totalCents: 1888, netCents: 1888, gstCents: 0 },
  { postedOn: "2025-09-06", kind: "meals", accountCode: "6100", label: "John & Irish's", description: "JOHN & IRISHS' NF CALG CALGARY CAN", totalCents: 1198, netCents: 1141, gstCents: 57 },
  { postedOn: "2025-09-07", kind: "meals", accountCode: "6100", label: "Banh Mi Sub", description: "BANH MI SUB CALGARY CAN", totalCents: 1098, netCents: 1046, gstCents: 52 },
  { postedOn: "2025-09-08", kind: "meals", accountCode: "6100", label: "Pita Basket", description: "PITA BASKET CALGARY CAN", totalCents: 1836, netCents: 1749, gstCents: 87 },
  { postedOn: "2025-09-11", kind: "blackmagic", accountCode: "6020", label: "Blackmagic Cloud", description: "BLACKMAGIC CLOUD FREMONT USA", totalCents: 1103, netCents: 1103, gstCents: 0 },
  { postedOn: "2025-09-13", kind: "meals", accountCode: "6100", label: "John & Irish's", description: "JOHN & IRISHS' NF CALG CALGARY CAN", totalCents: 756, netCents: 720, gstCents: 36 },
  { postedOn: "2025-09-14", kind: "meals", accountCode: "6100", label: "Wendy's", description: "WENDY'S MCKNIGHT CALGARY CAN", totalCents: 387, netCents: 369, gstCents: 18 },
  { postedOn: "2025-09-15", kind: "meals", accountCode: "6100", label: "Banh Mi Sub", description: "BANH MI SUB CALGARY CAN", totalCents: 844, netCents: 804, gstCents: 40 },
  { postedOn: "2025-09-19", kind: "meals", accountCode: "6100", label: "Jerusalem Shawarma", description: "JERUSALEM SHAWARMA CALGARY CAN", totalCents: 1675, netCents: 1595, gstCents: 80 },
  { postedOn: "2025-09-20", kind: "meals", accountCode: "6100", label: "Banh Mi Sub", description: "BANH MI SUB CALGARY CAN", totalCents: 998, netCents: 950, gstCents: 48 },
  { postedOn: "2025-09-20", kind: "meals", accountCode: "6100", label: "Five Guys", description: "Five Guys 1766 Calgary CAN", totalCents: 2654, netCents: 2528, gstCents: 126 },
  { postedOn: "2025-09-21", kind: "meals", accountCode: "6100", label: "John & Irish's", description: "JOHN & IRISHS' NF CALG CALGARY CAN", totalCents: 300, netCents: 286, gstCents: 14 },
  { postedOn: "2025-09-22", kind: "cursor", accountCode: "6020", label: "Cursor IDE", description: "CURSOR, AI POWERED IDE NEW YORK USA (USD", totalCents: 2847, netCents: 2847, gstCents: 0 },
  { postedOn: "2025-09-22", kind: "meals", accountCode: "6100", label: "DoorDash DashPass", description: "DOORDASHDASHPASS DOWNTOWN TORO CAN", totalCents: 524, netCents: 499, gstCents: 25 },
  { postedOn: "2025-09-23", kind: "meals", accountCode: "6100", label: "McDonald's", description: "MCDONALD'S #40408 CALGARY CAN", totalCents: 612, netCents: 583, gstCents: 29 },
  { postedOn: "2025-09-24", kind: "meals", accountCode: "6100", label: "John & Irish's", description: "JOHN & IRISHS' NF CALG CALGARY CAN", totalCents: 300, netCents: 286, gstCents: 14 },
  { postedOn: "2025-09-25", kind: "meals", accountCode: "6100", label: "Banh Mi Sub", description: "BANH MI SUB CALGARY CAN", totalCents: 998, netCents: 950, gstCents: 48 },
  { postedOn: "2025-09-26", kind: "adobe", accountCode: "6020", label: "Adobe Creative Cloud", description: "Adobe San Jose USA", totalCents: 1364, netCents: 1364, gstCents: 0 },
  { postedOn: "2025-09-26", kind: "meals", accountCode: "6100", label: "Wendy's", description: "WENDY'S HORIZON CALGARY CAN", totalCents: 387, netCents: 369, gstCents: 18 },
  { postedOn: "2025-10-04", kind: "meals", accountCode: "6100", label: "John & Irish's", description: "JOHN & IRISHS' NF CALG CALGARY CAN", totalCents: 600, netCents: 571, gstCents: 29 },
  { postedOn: "2025-10-04", kind: "meals", accountCode: "6100", label: "Pho Hoan Pasteur", description: "PHO HOAN PASTEUR CALGARY CAN", totalCents: 4584, netCents: 4366, gstCents: 218 },
  { postedOn: "2025-10-06", kind: "ctire", accountCode: "5100", label: "Canadian Tire shop supplies", description: "CANADIAN TIRE #419 CALGARY CAN", totalCents: 3148, netCents: 2998, gstCents: 150 },
  { postedOn: "2025-10-06", kind: "meals", accountCode: "6100", label: "John & Irish's", description: "JOHN & IRISHS' NF CALG CALGARY CAN", totalCents: 1618, netCents: 1541, gstCents: 77 },
  { postedOn: "2025-10-08", kind: "meals", accountCode: "6100", label: "John & Irish's", description: "JOHN & IRISHS' NF CALG CALGARY CAN", totalCents: 1202, netCents: 1145, gstCents: 57 },
  { postedOn: "2025-10-08", kind: "meals", accountCode: "6100", label: "John & Irish's", description: "JOHN & IRISHS' NF CALG CALGARY CAN", totalCents: 1058, netCents: 1008, gstCents: 50 },
  { postedOn: "2025-10-09", kind: "msft", accountCode: "6020", label: "Microsoft 365", description: "MICROSOFT#G115731110 MISSISSAUGA CAN", totalCents: 2017, netCents: 1921, gstCents: 96 },
  { postedOn: "2025-10-09", kind: "meals", accountCode: "6100", label: "Seniore's Pizza", description: "SENIORE'S PIZZA CALGARY CAN", totalCents: 435, netCents: 414, gstCents: 21 },
  { postedOn: "2025-10-12", kind: "memex", accountCode: "1600", label: "Memory Express computer parts", description: "MemoryExpress CAL NE Calgary CAN", totalCents: 31635, netCents: 30129, gstCents: 1506, ccaClass: "class50" },
  { postedOn: "2025-10-13", kind: "meals", accountCode: "6100", label: "A&W", description: "A&W #1323 CALGARY CAN", totalCents: 524, netCents: 499, gstCents: 25 },
  { postedOn: "2025-10-13", kind: "meals", accountCode: "6100", label: "John & Irish's", description: "JOHN & IRISHS' NF CALG CALGARY CAN", totalCents: 1058, netCents: 1008, gstCents: 50 },
  { postedOn: "2025-10-15", kind: "rona", accountCode: "5100", label: "Rona shop supplies", description: "RONA CALGARY 62860 CALGARY CAN", totalCents: 942, netCents: 897, gstCents: 45 },
  { postedOn: "2025-10-17", kind: "meals", accountCode: "6100", label: "John & Irish's", description: "JOHN & IRISHS' NF CALG CALGARY CAN", totalCents: 615, netCents: 586, gstCents: 29 },
  { postedOn: "2025-10-22", kind: "meals", accountCode: "6100", label: "DoorDash DashPass", description: "DOORDASHDASHPASS DOWNTOWN TORO CAN", totalCents: 524, netCents: 499, gstCents: 25 },
  { postedOn: "2025-10-23", kind: "meta", accountCode: "6050", label: "Meta ads", description: "PP*METAPLATFOR 4029357733 USA", totalCents: 1223, netCents: 1223, gstCents: 0 },
  { postedOn: "2025-10-25", kind: "meals", accountCode: "6100", label: "Domino's Pizza", description: "DOMINO'S PIZZA #1018 CALGARY CAN", totalCents: 2360, netCents: 2248, gstCents: 112 },
  { postedOn: "2025-10-25", kind: "meta", accountCode: "6050", label: "Meta ads", description: "PP*METAPLATFOR 4029357733 USA", totalCents: 908, netCents: 908, gstCents: 0 },
  { postedOn: "2025-10-26", kind: "adobe", accountCode: "6020", label: "Adobe Creative Cloud", description: "Adobe San Jose USA", totalCents: 2099, netCents: 2099, gstCents: 0 },
  { postedOn: "2025-10-26", kind: "meals", accountCode: "6100", label: "Banh Mi Sub", description: "BANH MI SUB CALGARY CAN", totalCents: 844, netCents: 804, gstCents: 40 },
  { postedOn: "2025-10-26", kind: "meals", accountCode: "6100", label: "John & Irish's", description: "JOHN & IRISHS' NF CALG CALGARY CAN", totalCents: 2809, netCents: 2675, gstCents: 134 },
  { postedOn: "2025-10-26", kind: "meals", accountCode: "6100", label: "John & Irish's", description: "JOHN & IRISHS' NF CALG CALGARY CAN", totalCents: 1308, netCents: 1246, gstCents: 62 },
  { postedOn: "2025-10-27", kind: "meals", accountCode: "6100", label: "Domino's Pizza", description: "DOMINOS PIZZA #10139 CALGARY CAN", totalCents: 2807, netCents: 2673, gstCents: 134 },
  { postedOn: "2025-10-28", kind: "meals", accountCode: "6100", label: "John & Irish's", description: "JOHN & IRISHS' NF CALG CALGARY CAN", totalCents: 600, netCents: 571, gstCents: 29 },
  { postedOn: "2025-11-01", kind: "meals", accountCode: "6100", label: "Coco Fresh tea", description: "SQ *CAL - COCO FRESH T CALGARY CAN", totalCents: 2503, netCents: 2384, gstCents: 119 },
  { postedOn: "2025-11-03", kind: "meals", accountCode: "6100", label: "Little Caesars", description: "LITTLE CAESARS PIZZA CALGARY CAN", totalCents: 839, netCents: 799, gstCents: 40 },
  { postedOn: "2025-11-04", kind: "meals", accountCode: "6100", label: "McDonald's", description: "MCDONALD'S #6617 CALGARY CAN", totalCents: 508, netCents: 484, gstCents: 24 },
  { postedOn: "2025-11-05", kind: "msft", accountCode: "6020", label: "Microsoft 365", description: "Microsoft-G121096739 msbill.info CAN", totalCents: 2017, netCents: 1921, gstCents: 96 },
  { postedOn: "2025-11-05", kind: "meals", accountCode: "6100", label: "Coco Fresh tea", description: "SQ *CAL - COCO FRESH T CALGARY CAN", totalCents: 784, netCents: 747, gstCents: 37 },
  { postedOn: "2025-11-07", kind: "meals", accountCode: "6100", label: "John & Irish's", description: "JOHN & IRISHS' NF CALG CALGARY CAN", totalCents: 575, netCents: 548, gstCents: 27 },
  { postedOn: "2025-11-07", kind: "meals", accountCode: "6100", label: "Taqueria El Chefe", description: "TAQUERIA EL CHEFE CALGARY CAN", totalCents: 2415, netCents: 2300, gstCents: 115 },
  { postedOn: "2025-11-07", kind: "meals", accountCode: "6100", label: "Taqueria El Chefe", description: "TAQUERIA EL CHEFE CALGARY CAN", totalCents: 2625, netCents: 2500, gstCents: 125 },
  { postedOn: "2025-11-10", kind: "meals", accountCode: "6100", label: "Popeyes", description: "POPEYES #12595 CALGARY CAN", totalCents: 1395, netCents: 1329, gstCents: 66 },
  { postedOn: "2025-11-11", kind: "meals", accountCode: "6100", label: "DoorDash meals", description: "DOORDASHCHUNJANG DOWNTOWN TORO CAN", totalCents: 5470, netCents: 5210, gstCents: 260 },
  { postedOn: "2025-11-11", kind: "meals", accountCode: "6100", label: "Coco Fresh tea", description: "SQ *CAL - COCO FRESH T CALGARY CAN", totalCents: 23, netCents: 22, gstCents: 1 },
  { postedOn: "2025-11-12", kind: "meals", accountCode: "6100", label: "John & Irish's", description: "JOHN & IRISHS' NF CALG CALGARY CAN", totalCents: 1647, netCents: 1569, gstCents: 78 },
  { postedOn: "2025-11-12", kind: "meals", accountCode: "6100", label: "Popeyes", description: "POPEYES #12595 CALGARY CAN", totalCents: 944, netCents: 899, gstCents: 45 },
  { postedOn: "2025-11-13", kind: "meals", accountCode: "6100", label: "Popeyes", description: "POPEYES #12595 CALGARY CAN", totalCents: 1994, netCents: 1899, gstCents: 95 },
  { postedOn: "2025-11-13", kind: "meals", accountCode: "6100", label: "Popeyes", description: "POPEYES #12595 CALGARY CAN", totalCents: 420, netCents: 400, gstCents: 20 },
  { postedOn: "2025-11-14", kind: "meals", accountCode: "6100", label: "DoorDash meals", description: "DOORDASHCOCOBUBBLET DOWNTOWN TORO CAN", totalCents: 1415, netCents: 1348, gstCents: 67 },
  { postedOn: "2025-11-16", kind: "rona", accountCode: "5100", label: "Rona shop supplies", description: "RONA CALGARY 62860 CALGARY CAN", totalCents: 702, netCents: 669, gstCents: 33 },
  { postedOn: "2025-11-16", kind: "rona", accountCode: "5100", label: "Rona shop supplies", description: "RONA+ CALGARY SUNRIDGE CALGARY CAN", totalCents: 4095, netCents: 3900, gstCents: 195 },
  { postedOn: "2025-11-17", kind: "meals", accountCode: "6100", label: "John & Irish's", description: "JOHN & IRISHS' NF CALG CALGARY CAN", totalCents: 270, netCents: 257, gstCents: 13 },
  { postedOn: "2025-11-19", kind: "meals", accountCode: "6100", label: "Popeyes", description: "POPEYES #12595 CALGARY CAN", totalCents: 1994, netCents: 1899, gstCents: 95 },
  { postedOn: "2025-11-20", kind: "meals", accountCode: "6100", label: "A&W", description: "A&W #1611 CALGARY CAN", totalCents: 735, netCents: 700, gstCents: 35 },
  { postedOn: "2025-11-20", kind: "meals", accountCode: "6100", label: "Shawarma Palace", description: "SHAWARMA PALACE CARRIN CALGARY CAN", totalCents: 2204, netCents: 2099, gstCents: 105 },
  { postedOn: "2025-11-22", kind: "meals", accountCode: "6100", label: "DoorDash DashPass", description: "DOORDASHDASHPASS DOWNTOWN TORO CAN", totalCents: 524, netCents: 499, gstCents: 25 },
  { postedOn: "2025-11-23", kind: "meals", accountCode: "6100", label: "John & Irish's", description: "JOHN & IRISHS' NF CALG CALGARY CAN", totalCents: 9751, netCents: 9287, gstCents: 464 },
  { postedOn: "2025-11-24", kind: "meals", accountCode: "6100", label: "A&W", description: "A&W #1611 CALGARY CAN", totalCents: 735, netCents: 700, gstCents: 35 },
  { postedOn: "2025-11-24", kind: "meals", accountCode: "6100", label: "Wow Cafe & Bakery", description: "WOW CAFE & BAKERY ROYA CALGARY CAN", totalCents: 3684, netCents: 3509, gstCents: 175 },
  { postedOn: "2025-11-26", kind: "adobe", accountCode: "6020", label: "Adobe Creative Cloud", description: "Adobe San Jose USA", totalCents: 2099, netCents: 2099, gstCents: 0 },
  { postedOn: "2025-11-26", kind: "meals", accountCode: "6100", label: "John & Irish's", description: "JOHN & IRISHS' NF CALG CALGARY CAN", totalCents: 915, netCents: 871, gstCents: 44 },
  { postedOn: "2025-11-30", kind: "meals", accountCode: "6100", label: "Kinton Ramen", description: "LS Kinton Ramen Calgar Calgary CAN", totalCents: 4616, netCents: 4396, gstCents: 220 },
  { postedOn: "2025-11-30", kind: "meals", accountCode: "6100", label: "Seniore's Pizza", description: "SENIORE'S PIZZA CALGARY CAN", totalCents: 435, netCents: 414, gstCents: 21 },
  { postedOn: "2025-12-04", kind: "msft", accountCode: "6020", label: "Microsoft 365", description: "MICROSOFT#G126512812 HALIFAX CAN", totalCents: 2017, netCents: 1921, gstCents: 96 },
  { postedOn: "2025-12-06", kind: "meals", accountCode: "6100", label: "John & Irish's", description: "JOHN & IRISHS' NF CALG CALGARY CAN", totalCents: 1677, netCents: 1597, gstCents: 80 },
  { postedOn: "2025-12-07", kind: "meals", accountCode: "6100", label: "Popeyes", description: "POPEYES #12595 CALGARY CAN", totalCents: 975, netCents: 929, gstCents: 46 },
  { postedOn: "2025-12-11", kind: "meals", accountCode: "6100", label: "John & Irish's", description: "JOHN & IRISHS' NF CALG CALGARY CAN", totalCents: 1395, netCents: 1329, gstCents: 66 },
  { postedOn: "2025-12-12", kind: "meals", accountCode: "6100", label: "McDonald's", description: "MCDONALD S #9505 CALGARY CAN", totalCents: 2812, netCents: 2678, gstCents: 134 },
  { postedOn: "2025-12-12", kind: "meals", accountCode: "6100", label: "Pita Basket", description: "PITA BASKET CALGARY CAN", totalCents: 2395, netCents: 2281, gstCents: 114 },
  { postedOn: "2025-12-13", kind: "meals", accountCode: "6100", label: "Popeyes", description: "POPEYES #12595 CALGARY CAN", totalCents: 891, netCents: 849, gstCents: 42 },
  { postedOn: "2025-12-17", kind: "ctire", accountCode: "5100", label: "Canadian Tire shop supplies", description: "CANADIAN TIRE #496 CALGARY CAN", totalCents: 3985, netCents: 3795, gstCents: 190 },
  { postedOn: "2025-12-17", kind: "meals", accountCode: "6100", label: "Ramen Ichinen", description: "RAMEN ICHINEN LTD CALGARY CAN", totalCents: 5806, netCents: 5530, gstCents: 276 },
  { postedOn: "2025-12-18", kind: "ctire", accountCode: "5100", label: "Canadian Tire shop supplies", description: "CANADIAN TIRE #496 CALGARY CAN", totalCents: 6298, netCents: 5998, gstCents: 300 },
  { postedOn: "2025-12-19", kind: "ctire", accountCode: "5100", label: "Canadian Tire shop supplies", description: "CANADIAN TIRE #419 CALGARY CAN", totalCents: 3149, netCents: 2999, gstCents: 150 },
  { postedOn: "2025-12-19", kind: "meals", accountCode: "6100", label: "Popeyes", description: "POPEYES #12595 CALGARY CAN", totalCents: 734, netCents: 699, gstCents: 35 },
  { postedOn: "2025-12-20", kind: "meals", accountCode: "6100", label: "A&W", description: "A&W #1611 CALGARY CAN", totalCents: 735, netCents: 700, gstCents: 35 },
  { postedOn: "2025-12-20", kind: "ctire", accountCode: "5100", label: "Canadian Tire shop supplies", description: "CANADIAN TIRE #419 CALGARY CAN", totalCents: 576, netCents: 549, gstCents: 27 },
  { postedOn: "2025-12-20", kind: "meals", accountCode: "6100", label: "McDonald's", description: "MCDONALD'S #40888 CALGARY CAN", totalCents: 131, netCents: 125, gstCents: 6 },
  { postedOn: "2025-12-20", kind: "meals", accountCode: "6100", label: "Popeyes", description: "POPEYES #12595 CALGARY CAN", totalCents: 765, netCents: 729, gstCents: 36 },
  { postedOn: "2025-12-20", kind: "meals", accountCode: "6100", label: "Shawarma Palace", description: "SHAWARMA PALACE CARRIN CALGARY CAN", totalCents: 1749, netCents: 1666, gstCents: 83 },
  { postedOn: "2025-12-20", kind: "homedepot", accountCode: "5100", label: "Home Depot shop supplies", description: "THE HOME DEPOT #7111 CALGARY CAN", totalCents: 1258, netCents: 1198, gstCents: 60 },
  { postedOn: "2025-12-21", kind: "meals", accountCode: "6100", label: "Manna Korean Cuisine", description: "MANNA KOREAN CUISINE CALGARY CAN", totalCents: 6521, netCents: 6210, gstCents: 311 },
  { postedOn: "2025-12-22", kind: "meals", accountCode: "6100", label: "DoorDash DashPass", description: "DOORDASHDASHPASS DOWNTOWN TORO CAN", totalCents: 524, netCents: 499, gstCents: 25 },
  { postedOn: "2025-12-22", kind: "meals", accountCode: "6100", label: "McDonald's", description: "MCDONALD'S #40888 CALGARY CAN", totalCents: 1705, netCents: 1624, gstCents: 81 },
  { postedOn: "2025-12-22", kind: "meals", accountCode: "6100", label: "McDonald's", description: "MCDONALD'S #40888 CALGARY CAN", totalCents: 1269, netCents: 1209, gstCents: 60 },
  { postedOn: "2025-12-24", kind: "ctire", accountCode: "5100", label: "Canadian Tire shop supplies", description: "CANADIAN TIRE #419 CALGARY CAN", totalCents: 41473, netCents: 39498, gstCents: 1975 },
  { postedOn: "2025-12-24", kind: "ctire", accountCode: "5100", label: "Canadian Tire shop supplies", description: "CANADIAN TIRE #496 CALGARY CAN", totalCents: 1574, netCents: 1499, gstCents: 75 },
  { postedOn: "2025-12-27", kind: "adobe", accountCode: "6020", label: "Adobe Creative Cloud", description: "Adobe San Jose USA", totalCents: 1364, netCents: 1364, gstCents: 0 },
  { postedOn: "2025-12-27", kind: "ups", accountCode: "5040", label: "UPS freight", description: "UPS*WEB COD 888-520-9090 CAN", totalCents: 7948, netCents: 7570, gstCents: 378 },
]

export type NeoJournalLine = {
  accountCode: string
  accountName: string
  debitCents: number
  creditCents: number
  memo: string
  taxCode?: string
}

export type NeoMonthJournal = {
  entryNumber: string
  month: string
  postedOn: string
  claims: NeoClaim[]
}

export function splitGstInclusiveCents(totalCents: number) {
  const gstCents = Math.round((totalCents * 5) / 105)
  return { gstCents, netCents: totalCents - gstCents }
}

export function neoMealClaims(claims: readonly NeoClaim[] = NEO_2025_CLAIMS) {
  return claims.filter((claim) => claim.kind === "meals")
}

export function neoMealsNondeductibleCents(claims: readonly NeoClaim[] = NEO_2025_CLAIMS) {
  const net = neoMealClaims(claims).reduce((sum, claim) => sum + claim.netCents, 0)
  return Math.round(net / 2)
}

export function neoCcaItems(ccaClass: "class8" | "class50") {
  return NEO_2025_CLAIMS.filter((claim) => claim.ccaClass === ccaClass).map((claim) => ({
    invoiceNumber: `NEO-2025-${claim.postedOn.slice(5, 7)}`,
    description: claim.label,
    costCents: claim.netCents,
  }))
}

export function neoClaimTotals(claims: readonly NeoClaim[] = NEO_2025_CLAIMS) {
  return claims.reduce(
    (sum, claim) => ({
      count: sum.count + 1,
      totalCents: sum.totalCents + claim.totalCents,
      netCents: sum.netCents + claim.netCents,
      gstCents: sum.gstCents + claim.gstCents,
    }),
    { count: 0, totalCents: 0, netCents: 0, gstCents: 0 }
  )
}

export function neoMonthlyJournals(): NeoMonthJournal[] {
  const byMonth = new Map<string, NeoClaim[]>()
  for (const claim of NEO_2025_CLAIMS) {
    const month = claim.postedOn.slice(0, 7)
    const list = byMonth.get(month) ?? []
    list.push(claim)
    byMonth.set(month, list)
  }
  return [...byMonth.entries()].map(([month, claims]) => ({
    entryNumber: `NEO-2025-${month.slice(5)}`,
    month,
    postedOn: claims[claims.length - 1].postedOn,
    claims,
  }))
}

export function neoMonthJournalLines(month: NeoMonthJournal): NeoJournalLine[] {
  const lines: NeoJournalLine[] = month.claims.map((claim) => ({
    accountCode: claim.accountCode,
    accountName: NEO_ACCOUNT_NAMES[claim.accountCode] ?? claim.accountCode,
    debitCents: claim.netCents,
    creditCents: 0,
    memo: `${claim.label} · ${claim.description}`,
  }))
  const gstCents = month.claims.reduce((sum, claim) => sum + claim.gstCents, 0)
  if (gstCents > 0) {
    lines.push({
      accountCode: "1160",
      accountName: "GST Input Tax Credits Receivable",
      debitCents: gstCents,
      creditCents: 0,
      memo: `GST ITC ${month.entryNumber}`,
      taxCode: "GST_5_ITC",
    })
  }
  const totalCents = month.claims.reduce((sum, claim) => sum + claim.totalCents, 0)
  lines.push({
    accountCode: "2310",
    accountName: "Shareholder Loan - Jerrold",
    debitCents: 0,
    creditCents: totalCents,
    memo: `Neo •••• ${NEO_CARD_LAST4} shop charges ${month.entryNumber}`,
  })
  return lines
}

export function neoMonthBalances(month: NeoMonthJournal) {
  const lines = neoMonthJournalLines(month)
  const debit = lines.reduce((sum, line) => sum + line.debitCents, 0)
  const credit = lines.reduce((sum, line) => sum + line.creditCents, 0)
  const totals = neoClaimTotals(month.claims)
  return debit === credit && credit === totals.totalCents && totals.netCents + totals.gstCents === totals.totalCents
}

