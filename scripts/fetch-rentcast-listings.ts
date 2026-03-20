/**
 * Fetch rental listings from RentCast API by ZIP code.
 *
 * Caches raw JSON to data/rentcast/{metro}/{zip}.json to avoid repeat API calls.
 * RentCast Pro tier: 10,000 calls/month, up to 500 results per call.
 *
 * SAFETY: Hard cap at 500 API calls per run.
 * Cached responses (< 5 days old) don't count toward this cap.
 *
 * Usage:
 *   npx tsx scripts/fetch-rentcast-listings.ts
 *   npx tsx scripts/fetch-rentcast-listings.ts --metro nashville-tn
 */

import { config } from "dotenv";
config({ path: ".env.local" });
import * as fs from "fs";
import * as path from "path";

const RENTCAST_API_KEY = process.env.RENTCAST_API_KEY;
if (!RENTCAST_API_KEY) {
  console.error("RENTCAST_API_KEY is not set. Add it to .env.local or your environment.");
  process.exit(1);
}

const RENTCAST_BASE = "https://api.rentcast.io/v1/listings/rental/long-term";
const CACHE_MAX_AGE_DAYS = 5;
const API_CALL_LIMIT = 500; // Pro tier — 10K calls/month

// Strategic ZIPs near hospital clusters per metro
const METRO_ZIPS: Record<string, string[]> = {
  // Original 3 metros
  "nashville-tn": [
    "37203", // Midtown / Vanderbilt Medical Center
    "37212", // Hillsboro Village / Vanderbilt corridor
    "37209", // West Nashville / Centennial Medical Center area
    "37232", // Vanderbilt University Medical Center ZIP
    "37204", // Berry Hill / 8th Ave South
    "37215", // Green Hills
    "37206", // East Nashville
    "37208", // Germantown / North Nashville
    "37207", // Dickerson Pike / North Nashville
    "37216", // Inglewood / near Skyline Medical
    "37013", // Antioch / Southern Hills Medical Center
    "37211", // Nolensville Pike / Baptist Hospital area
    "37217", // Donelson
    "37218", // Bordeaux / North Nashville
  ],

  "houston-tx": [
    "77030", // Texas Medical Center core
    "77054", // South Main / Medical Center adjacent
    "77021", // Third Ward / MacGregor
    "77004", // Midtown Houston
    "77025", // Braeswood / Medical Center south
    "77005", // West University Place
    "77002", // Downtown Houston
    "77019", // River Oaks
    "77027", // Greenway Plaza
    "77007", // Heights / Washington Ave
    "77006", // Montrose
    "77098", // Upper Kirby / Greenway
    "77401", // Bellaire
    "77096", // Meyerland / Braeswood
    "77051", // South Houston / Hobby Hospital area
  ],

  "phoenix-az": [
    "85006", // Central Phoenix / St. Joseph's Hospital area
    "85008", // East Phoenix / Banner Gateway area
    "85054", // North Scottsdale / Mayo Clinic area
    "85251", // Old Town Scottsdale
    "85016", // Biltmore / Camelback
    "85014", // Midtown Phoenix / Camelback Medical corridor
    "85004", // Downtown Phoenix / Banner University
    "85013", // Central Phoenix
    "85012", // Camelback East / midtown
    "85015", // Encanto / west-central Phoenix
    "85017", // West Phoenix / Maryvale
    "85032", // Paradise Valley / Scottsdale Healthcare
    "85028", // North Phoenix / Shea corridor
    "85018", // Arcadia / Scottsdale border
    "85259", // Scottsdale / HonorHealth Shea
  ],

  // Wave 2 metros — ZIPs near major hospital clusters
  "atlanta-ga": [
    "30322", // Emory University Hospital
    "30303", // Downtown Atlanta / Grady Memorial
    "30308", // Midtown Atlanta
    "30342", // Buckhead / Northside Hospital area
    "30309", // Ansley Park / Piedmont Hospital
    "30324", // Morningside / Emory corridor
    "30306", // Poncey-Highland / Virginia-Highland
    "30307", // Inman Park / Candler Park
    "30312", // Grant Park / Summerhill
    "30311", // West End / Cascade Road
    "30318", // West Midtown / English Ave
    "30345", // Tucker / Northlake / CHOA Scottish Rite area
    "30033", // Decatur / DeKalb Medical area
    "30329", // Druid Hills / Emory Villages
  ],

  "dallas-tx": [
    "75235", // Medical District / UT Southwestern
    "75390", // UT Southwestern main campus
    "75246", // Baylor Scott & White Dallas
    "75231", // Northeast Dallas / Medical City Dallas
    "75230", // North Dallas / Medical City area
    "75204", // Uptown / Lower Greenville
    "75219", // Oak Lawn / Cedar Springs
    "75201", // Downtown Dallas
    "75205", // Highland Park / Knox-Henderson
    "75206", // Lower Greenville / M Streets
    "75214", // Lakewood / East Dallas
    "75218", // Lake Highlands / Casa Linda
    "75220", // Love Field / Medical District adjacent
    "75247", // Design District / northwest Dallas
    "75208", // Kessler Park / Oak Cliff
  ],

  "denver-co": [
    "80204", // West Colfax / Denver Health
    "80218", // Capitol Hill / Cheesman Park
    "80220", // Hale / Mayfair / Rose Medical Center
    "80045", // Anschutz Medical Campus (Aurora)
    "80210", // Platt Park / Observatory Park
    "80206", // Congress Park / Cherry Creek
    "80203", // Capitol Hill / Downtown Denver
    "80209", // Washington Park
    "80205", // Five Points / RiNo
    "80207", // Park Hill / Northeast Denver
    "80222", // University Hills / Cherry Hills Village adj.
    "80246", // Glendale / Cherry Creek adjacent
    "80012", // Aurora / Children's Hospital Colorado
    "80010", // Aurora / Fitzsimons corridor
  ],

  "chicago-il": [
    "60612", // Medical District / Rush University / UIC
    "60611", // Streeterville / Northwestern Memorial
    "60637", // Hyde Park / University of Chicago Medicine
    "60615", // Kenwood / Woodlawn / U of C adjacent
    "60622", // Wicker Park / Ukrainian Village
    "60614", // Lincoln Park
    "60657", // Lakeview
    "60640", // Uptown / Ravenswood Medical Center
    "60625", // Albany Park / Swedish Covenant area
    "60660", // Edgewater / St. Francis Hospital area
    "60608", // Bridgeport / Pilsen / near Medical District
    "60616", // Chinatown / near Medical District
    "60601", // Loop / Downtown Chicago
    "60610", // Gold Coast / Near North
    "60647", // Logan Square
  ],

  "los-angeles-ca": [
    "90033", // Boyle Heights / USC Keck Medical Center
    "90024", // Westwood / UCLA Medical Center
    "90027", // Los Feliz / Children's Hospital LA
    "90048", // Beverly Grove / Cedars-Sinai
    "90095", // UCLA campus ZIP
    "90057", // MacArthur Park / near County-USC
    "90026", // Silver Lake / Echo Park
    "90029", // Hollywood / East Hollywood
    "90004", // Koreatown / Wilshire corridor
    "90005", // Koreatown / Wilshire
    "90019", // Mid-City / West Adams
    "90034", // Palms / Culver City adjacent
    "90035", // Pico-Robertson / Beverly Hills adj.
    "90064", // Rancho Park / West LA
    "90025", // West LA / Sawtelle
  ],

  "san-francisco-ca": [
    "94122", // Inner Sunset / UCSF Parnassus
    "94143", // UCSF Parnassus campus ZIP
    "94115", // Western Addition / CPMC Pacific Campus
    "94110", // Mission District
    "94103", // SoMa / near ZSFG
    "94158", // Mission Bay / UCSF Mission Bay
    "94117", // Haight-Ashbury / near UCSF
    "94102", // Civic Center / Tenderloin
    "94107", // Potrero Hill / DogPatch
    "94109", // Russian Hill / Nob Hill
    "94114", // Castro / Noe Valley
    "94131", // Glen Park / Diamond Heights
    "94134", // Visitacion Valley / Crocker-Amazon
    "94112", // Excelsior / Ocean View
  ],

  "seattle-wa": [
    "98104", // First Hill / Swedish Medical Center / Virginia Mason
    "98195", // University of Washington Medical Center
    "98122", // Capitol Hill / First Hill
    "98109", // South Lake Union / Seattle Children's corridor
    "98112", // Madison Park / Madrona
    "98105", // University District / UW
    "98102", // Eastlake / Portage Bay
    "98101", // Downtown Seattle / Belltown
    "98107", // Ballard / Northwest Hospital area
    "98103", // Fremont / Green Lake
    "98115", // Ravenna / Bryant / Northeast Seattle
    "98116", // West Seattle / Junction
    "98118", // Columbia City / Rainier Valley / Harborview adjacent
    "98144", // Beacon Hill / Mount Baker
    "98199", // Magnolia / Discovery Park
  ],

  "boston-ma": [
    "02115", // Longwood Medical Area / Fenway
    "02114", // Beacon Hill / MGH
    "02120", // Mission Hill / Roxbury / Brigham & Women's adjacent
    "02215", // Kenmore / Fenway / Boston Medical area
    "02135", // Brighton / St. Elizabeth's Medical Center
    "02130", // Jamaica Plain
    "02116", // Back Bay
    "02118", // South End / Boston Medical Center
    "02119", // Roxbury / BMC adjacent
    "02125", // Dorchester / Carney Hospital area
    "02126", // Mattapan / Milton Hospital adjacent
    "02124", // Dorchester / Codman Square
    "02121", // Roxbury / Dudley Square
    "02127", // South Boston
    "02134", // Allston
  ],

  "miami-fl": [
    "33136", // Overtown / Jackson Memorial / UM Hospital
    "33101", // Jackson Memorial ZIP
    "33125", // Little Havana / West of Brickell
    "33140", // Miami Beach / North Beach
    "33139", // South Beach / Miami Beach
    "33133", // Coconut Grove / Coral Gables border
    "33130", // Brickell / Downtown Miami
    "33132", // Downtown Miami / Edgewater
    "33137", // Upper Eastside / Wynwood / Design District
    "33138", // MiMo / Upper East Side / Morningside
    "33127", // Allapattah / Health District adjacent
    "33128", // Downtown Miami / Overtown
    "33129", // Coral Way / Silver Bluff
    "33143", // South Miami / Baptist Health area
    "33146", // Coral Gables / UM Coral Gables
  ],

  "philadelphia-pa": [
    "19104", // West Philadelphia / HUP / Penn Medicine
    "19107", // Center City / Jefferson / Hahnemann area
    "19141", // Germantown / Einstein Medical Center area
    "19140", // North Philadelphia / Temple University Hospital
    "19146", // Graduate Hospital / South Philly
    "19102", // Center City West / Rittenhouse
    "19103", // Rittenhouse Square / Logan Square
    "19130", // Fairmount / Art Museum
    "19123", // Northern Liberties / Fishtown
    "19125", // Fishtown / Kensington
    "19147", // South Philadelphia / Passyunk
    "19148", // South Philadelphia / East Passyunk
    "19106", // Old City / Society Hill
    "19145", // South Philadelphia / Packer Park
    "19143", // Cobbs Creek / West Philadelphia
  ],

  "san-diego-ca": [
    "92103", // Hillcrest / Bankers Hill / Scripps Mercy
    "92123", // Mission Valley / Sharp Memorial
    "92120", // Allied Gardens / San Carlos / Sharp Grossmont adj.
    "92037", // La Jolla / UCSD Medical Center
    "92101", // Downtown San Diego / Little Italy
    "92108", // Mission Valley / Fashion Valley
    "92116", // Normal Heights / North Park
    "92104", // North Park / South Park
    "92105", // City Heights / East San Diego
    "92115", // College Area / SDSU / Sharp College area
    "92122", // University City / UCSD adjacent
    "92107", // Ocean Beach / Point Loma
    "92106", // Point Loma / Liberty Station
    "92110", // Mission Hills / Old Town
    "92111", // Linda Vista / Kearny Mesa / Rady Children's
  ],

  "minneapolis-mn": [
    "55455", // University of Minnesota Medical Center
    "55404", // Elliot Park / HCMC / Abbott Northwestern
    "55407", // Phillips / Powderhorn
    "55414", // Prospect Park / Dinkytown / Fairview area
    "55408", // Whittier / Lyndale
    "55416", // St. Louis Park / Methodist Hospital
    "55403", // Loring Park / Hennepin corridor
    "55405", // Near North / North Minneapolis
    "55406", // Longfellow / Seward
    "55409", // Kingfield / Windom
    "55411", // Near North / Glenwood
    "55412", // Hawthorne / Camden / North Minneapolis
    "55418", // Northeast Minneapolis / St. Anthony
    "55419", // Tangletown / Minnehaha / Richfield border
    "55422", // Robbinsdale / Crystal / North Memorial area
  ],

  "orlando-fl": [
    "32806", // South Orlando / Orlando Health / ORMC
    "32803", // Colonialtown / Mills-50 / Florida Hospital area
    "32804", // College Park / near ORMC
    "32801", // Downtown Orlando
    "32805", // West Downtown / Pine Hills adjacent
    "32808", // Pine Hills / Rosemont
    "32789", // Winter Park / AdventHealth Winter Park
    "32792", // Winter Park / Goldenrod / AdventHealth area
    "32817", // East Orlando / UCF / CFHMC
    "32826", // East Orlando / near UCF Medical
    "32839", // South Orlando / Dr. Phillips area
    "32822", // Conway / Southeast Orlando
    "32824", // Meadow Woods / South Orlando
    "32819", // Dr. Phillips / Tourist Corridor
    "32810", // Lockhart / Northwest Orlando
  ],

  "charlotte-nc": [
    "28203", // South End / Dilworth / Novant Presbyterians area
    "28204", // Elizabeth / CMMC / Atrium Health center
    "28207", // Myers Park / Eastover
    "28209", // Myers Park / Pineville adjacent
    "28210", // South Charlotte / Ballantyne / Atrium Pineville
    "28232", // Carolinas Medical Center main ZIP
    "28205", // Plaza Midwood / NoDa
    "28206", // North Charlotte / University area
    "28208", // West Charlotte / Airport adjacent
    "28211", // Cotswold / South Park / Novant Southpark area
    "28212", // Eastland / East Charlotte
    "28213", // University City / UNCC / Carolinas Medical Univ
    "28214", // Steele Creek / West Charlotte
    "28216", // Huntersville / Lake Norman / Atrium Huntersville
  ],

  "tampa-fl": [
    "33606", // Hyde Park / Davis Islands / Tampa General
    "33613", // University of South Florida / Tampa VA
    "33612", // Suitcase City / USF area / Moffitt Cancer Center
    "33610", // East Tampa / Brandon Hospital adjacent
    "33602", // Downtown Tampa / Channelside
    "33609", // West Tampa / Westshore / St. Joseph's Hospital
    "33605", // Ybor City / East Tampa
    "33603", // Seminole Heights / North Tampa
    "33604", // Sulphur Springs / North Tampa
    "33607", // Westshore / Town 'N Country
    "33614", // Carrollwood / Drew Park area
    "33619", // Gibsonton / Riverview / Brandon border
    "33629", // South Tampa / Palma Ceia
    "33616", // South Tampa / Port Tampa / MacDill area
    "33611", // Ballast Point / South Tampa
  ],

  // Wave 3 metros
  "new-york-ny": [
    "10016", // Murray Hill / Kips Bay / NYU Langone
    "10029", // East Harlem / Mount Sinai
    "10032", // Washington Heights / NewYork-Presbyterian
    "10065", // Upper East Side / Weill Cornell
    "10003", // East Village / Beth Israel adjacent
    "10021", // Upper East Side / Rockefeller University
    "10019", // Midtown West / Roosevelt Hospital area
    "10025", // Upper West Side / Columbia Presbyterian adjacent
    "10031", // Hamilton Heights / Harlem
    "10037", // Harlem / Harlem Hospital
    "10456", // South Bronx / Lincoln Hospital area
    "10461", // Pelham Parkway / Montefiore area
    "11201", // Brooklyn Heights / Brooklyn Methodist
    "11203", // Flatbush / Kings County Hospital
    "11355", // Flushing / Queens / NewYork-Presbyterian Queens
  ],

  "washington-dc": [
    "20007", // Georgetown / Georgetown University Hospital
    "20010", // Columbia Heights / Washington Hospital Center
    "20037", // Foggy Bottom / GWU Hospital
    "22042", // Falls Church / Inova Fairfax Hospital area
    "22030", // Fairfax / Inova Fair Oaks area
    "20002", // Near Northeast / Capitol Hill
    "20009", // Adams Morgan / U Street / Howard University Hospital area
    "20011", // Petworth / Takoma / Washington Adventist adjacent
    "20012", // Takoma / Brightwood
    "20016", // American University Park / Tenleytown
    "20001", // Shaw / Blagden Alley / DC General area
    "20003", // Capitol Hill / Barracks Row
    "20017", // Brookland / CUA / Providence Hospital area
    "20032", // Congress Heights / Saint Elizabeths area
    "22204", // Arlington / Virginia Hospital Center area
  ],

  "baltimore-md": [
    "21205", // East Baltimore / Johns Hopkins Hospital
    "21287", // Johns Hopkins main campus ZIP
    "21201", // Downtown Baltimore / University of Maryland Medical
    "21218", // Waverly / Homewood / Johns Hopkins campus
    "21224", // Canton / Fells Point / Johns Hopkins Bayview adj.
    "21202", // Inner Harbor / Downtown
    "21211", // Hampden / Medfield / Rotunda area
    "21210", // Roland Park / Guilford / GBMC area
    "21215", // Park Heights / Sinai Hospital area
    "21216", // Edmondson Village / Forest Park
    "21217", // West Baltimore / Penn North / Coppin adjacent
    "21223", // Pigtown / Carroll-Camden / UMMC adjacent
    "21225", // Brooklyn / Cherry Hill / Anne Arundel Medical adj.
    "21228", // Catonsville / University of Maryland BioPark area
  ],

  "detroit-mi": [
    "48202", // New Center / Henry Ford Hospital
    "48201", // Midtown / Detroit Medical Center / Wayne State
    "48073", // Royal Oak / Beaumont Hospital Royal Oak
    "48109", // University of Michigan Medical Center (Ann Arbor)
    "48197", // Ypsilanti / St. Joseph Mercy Hospital area
    "48180", // Taylor / Beaumont Hospital Taylor
    "48203", // Highland Park / Hamtramck / DRHS area
    "48205", // East Detroit / Grosse Pointe border
    "48206", // Boston-Edison / west Midtown
    "48207", // Eastern Market / Lafayette Park / DMC adjacent
    "48208", // Woodbridge / Corktown / near DMC
    "48209", // Southwest Detroit / Delray
    "48236", // Grosse Pointe / Harper Hospital adjacent
    "48334", // Farmington Hills / Beaumont Farmington Hills
  ],

  "san-antonio-tx": [
    "78229", // South Texas Medical Center / UT Health
    "78207", // West San Antonio / near CHRISTUS Santa Rosa
    "78204", // King William / near CHRISTUS downtown
    "78212", // Monte Vista / Tobin Hill / near Baptist Medical
    "78215", // Downtown San Antonio / River North
    "78240", // Westover Hills / Methodist Hospital area
    "78201", // Deco District / near Medical Center
    "78209", // Alamo Heights / near Baptist Terrace
    "78210", // Southside / near Brooke Army Medical Center
    "78217", // Northeast San Antonio / Northeast Baptist area
    "78218", // Terrell Hills / near BAMC
    "78228", // Prospect Hill / near UTHSC
    "78230", // North Central / near Methodist Ambulatory
    "78232", // Stone Oak / North San Antonio / CHRISTUS North
    "78216", // Airport / near North Central Baptist
  ],

  "austin-tx": [
    "78701", // Downtown Austin / Brackenridge / Dell Seton area
    "78705", // UT Austin / West Campus / Seton Medical
    "78712", // UT Austin main campus ZIP
    "78756", // Brentwood / Allandale / Northwest Hills adj.
    "78731", // Northwest Hills / St. David's North Austin adj.
    "78745", // South Austin / near St. David's South Austin
    "78702", // East Austin / Holly
    "78703", // Tarrytown / West End / Seton Medical area
    "78704", // South Congress / Bouldin Creek / St. David's adj.
    "78723", // Windsor Park / Mueller / Dell Children's adj.
    "78727", // North Austin / Scofield Farms / St. David's North
    "78729", // North Austin / Milwood / Williamson area
    "78748", // South Austin / Slaughter Creek / Austin Medical
    "78741", // East Riverside / Pleasant Valley
    "78746", // Westlake Hills / near St. David's Medical Center
  ],

  "portland-or": [
    "97239", // South Portland / OHSU main campus
    "97210", // Northwest Portland / Legacy Good Samaritan
    "97201", // Portland Heights / South Park Blocks
    "97232", // Lloyd District / Northeast Portland / Legacy Emanuel adj.
    "97213", // Laurelhurst / Hollywood
    "97202", // Sellwood / Moreland / South Portland
    "97203", // St. Johns / North Portland / Legacy Emanuel area
    "97206", // Foster-Powell / Woodstock / Southeast
    "97211", // Piedmont / Woodlawn / Northeast
    "97212", // Irvington / Alameda / Northeast Portland
    "97214", // Buckman / Hosford-Abernethy / Southeast
    "97215", // Mt. Tabor / Stark / East Portland
    "97217", // Kenton / North Portland / near Columbia Park
    "97219", // Southwest Portland / Multnomah Village / OHSU adj.
    "97266", // Lents / Foster / Southeast Portland
  ],

  "st-louis-mo": [
    "63110", // Forest Park Southeast / Washington University / Barnes-Jewish
    "63104", // Soulard / Lafayette Square
    "63108", // Central West End / Washington University Medical Campus
    "63130", // University City / Delmar Loop / near WUSM
    "63139", // Southwest Garden / Lindenwood Park
    "63109", // Clifton Heights / Southwest St. Louis
    "63111", // Marine Villa / Carondelet
    "63112", // Fountain Park / Hamilton Heights / near Deaconess
    "63113", // Vandeventer / Midtown
    "63116", // Tower Grove South / Dutchtown
    "63117", // Clayton / Maplewood border
    "63118", // Dutchtown / Benton Park West
    "63119", // Webster Groves / near Des Peres Hospital
    "63122", // Kirkwood / Sunset Hills
    "63141", // Chesterfield / Creve Coeur / Mercy Hospital area
  ],

  "pittsburgh-pa": [
    "15213", // Oakland / UPMC Presbyterian / Shadyside
    "15261", // University of Pittsburgh / UPMC ZIP
    "15212", // North Shore / North Side / Allegheny General
    "15224", // Bloomfield / Friendship / near UPMC
    "15206", // East Liberty / Shadyside / UPMC Shadyside
    "15232", // Shadyside / Squirrel Hill North
    "15201", // Lawrenceville / Upper Lawrenceville
    "15202", // Bellevue / Avalon / Ohio Valley Hospital area
    "15203", // South Side Flats / South Shore
    "15204", // Elliot / West End / near St. Clair Hospital adj.
    "15205", // Crafton / Carnegie / near WPIC
    "15208", // Homewood / Brushton / Wilkinsburg
    "15217", // Squirrel Hill South / Swissvale border
    "15219", // Uptown / Hill District / UPMC Mercy
    "15222", // Downtown Pittsburgh / Strip District
  ],

  "raleigh-nc": [
    "27710", // Duke University Medical Center (Durham)
    "27599", // UNC Medical Center ZIP (Chapel Hill)
    "27610", // East Raleigh / WakeMed main campus
    "27607", // Southwest Raleigh / near Rex Hospital
    "27609", // North Hills / North Raleigh
    "27601", // Downtown Raleigh
    "27603", // South Raleigh / Garner adjacent / WakeMed south
    "27604", // Northeast Raleigh / Millbrook
    "27605", // Boylan Heights / Five Points / Glenwood South
    "27606", // Southwest Raleigh / Avent Ferry / Rex area
    "27608", // Five Points / Budleigh / Cameron Park
    "27612", // Brier Creek / North Raleigh / WakeMed North
    "27613", // North Raleigh / Wake Forest adjacent
    "27614", // North Raleigh / Falls of Neuse
    "27703", // Durham / Southpoint / Duke Health area
  ],

  "columbus-oh": [
    "43210", // OSU Medical Center / Wexner Medical Center
    "43205", // South Columbus / Livingston Ave / Nationwide Children's
    "43215", // Downtown Columbus / Short North
    "43202", // Clintonville / University District
    "43201", // University District / OSU area
    "43206", // German Village / Merion Village
    "43203", // Near East Side / King-Lincoln District
    "43204", // Franklinton / near OhioHealth Grant Medical
    "43207", // Merion Village / Scioto Southland
    "43209", // Bexley / East Columbus
    "43211", // Northeast Columbus / Northland / Grant area
    "43212", // Grandview Heights / Marble Cliff / OhioHealth area
    "43213", // Whitehall / East Columbus / Mount Carmel East
    "43214", // Clintonville / Beechwold
    "43228", // West Columbus / Hilliard / OhioHealth Riverside adj.
  ],

  "cleveland-oh": [
    "44195", // Cleveland Clinic main campus
    "44106", // University Circle / Case Western / UH Cleveland
    "44109", // Old Brooklyn / MetroHealth Medical Center
    "44104", // Central / Hough / near MetroHealth
    "44103", // St. Clair-Superior / Glenville
    "44113", // Ohio City / Tremont / near MetroHealth
    "44107", // Lakewood / West Park / St. John Medical adj.
    "44108", // Glenville / East Cleveland
    "44112", // East Cleveland / South Euclid / Hillcrest area
    "44114", // Downtown Cleveland / East 4th
    "44115", // Midtown Cleveland / Prospect Ave
    "44118", // Cleveland Heights / Coventry / UH Rainbow adj.
    "44120", // Shaker Heights / Warrensville / Richmond Medical
    "44122", // Beachwood / Orange / University Suburban Health
    "44130", // Parma / Parma Medical Center / Southwest General
  ],
};

let apiCallsMade = 0;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getCachePath(cacheDir: string, zip: string): string {
  return path.join(cacheDir, `${zip}.json`);
}

function isCacheValid(cachePath: string): boolean {
  if (!fs.existsSync(cachePath)) return false;
  const ageMs = Date.now() - fs.statSync(cachePath).mtimeMs;
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  return ageDays < CACHE_MAX_AGE_DAYS;
}

async function fetchZip(zip: string, cacheDir: string): Promise<{ listings: number; fromCache: boolean }> {
  const cachePath = getCachePath(cacheDir, zip);

  // Use cache if fresh enough
  if (isCacheValid(cachePath)) {
    const cached = JSON.parse(fs.readFileSync(cachePath, "utf-8"));
    const ageDays = (Date.now() - fs.statSync(cachePath).mtimeMs) / (1000 * 60 * 60 * 24);
    console.log(`  [CACHE] ${zip}: ${cached.length} listings (${ageDays.toFixed(1)} days old)`);
    return { listings: cached.length, fromCache: true };
  }

  // Check API call budget BEFORE making the request
  if (apiCallsMade >= API_CALL_LIMIT) {
    console.warn(`  [SKIP] ${zip}: API call limit reached (${API_CALL_LIMIT}). Use cache or wait.`);
    return { listings: 0, fromCache: false };
  }

  const url = `${RENTCAST_BASE}?zipCode=${zip}&limit=500&status=Active`;
  console.log(`  [FETCH] ${zip} (API call ${apiCallsMade + 1}/${API_CALL_LIMIT})...`);
  apiCallsMade++;

  const res = await fetch(url, {
    headers: {
      "X-Api-Key": RENTCAST_API_KEY!,
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`  [ERROR] ${zip}: HTTP ${res.status} — ${body.slice(0, 200)}`);

    // If we hit rate limit (429), stop immediately
    if (res.status === 429) {
      console.error("\n  Rate limited by RentCast! Stopping to preserve quota.");
      apiCallsMade = API_CALL_LIMIT; // Prevent further calls
    }

    return { listings: 0, fromCache: false };
  }

  const data = await res.json();
  const listings = Array.isArray(data) ? data : [];

  // Cache raw response
  fs.writeFileSync(cachePath, JSON.stringify(listings, null, 2));
  console.log(`  [OK] ${zip}: ${listings.length} listings`);

  return { listings: listings.length, fromCache: false };
}

async function main() {
  const args = process.argv.slice(2);
  const metroArg = args.find((a) => a.startsWith("--metro"))
    ? args[args.indexOf("--metro") + 1]
    : null;

  const metros = metroArg ? { [metroArg]: METRO_ZIPS[metroArg] } : METRO_ZIPS;

  if (metroArg && !METRO_ZIPS[metroArg]) {
    console.error(`Unknown metro: ${metroArg}. Available: ${Object.keys(METRO_ZIPS).join(", ")}`);
    process.exit(1);
  }

  // Count how many API calls we'll need (non-cached ZIPs)
  let uncachedCount = 0;
  for (const [metro, zips] of Object.entries(metros)) {
    if (!zips) continue;
    const cacheDir = path.join(process.cwd(), "data", "rentcast", metro);
    for (const zip of zips) {
      if (!isCacheValid(getCachePath(cacheDir, zip))) uncachedCount++;
    }
  }

  console.log(`=== RentCast Fetch ===`);
  console.log(`ZIPs to fetch: ${uncachedCount} uncached (limit: ${API_CALL_LIMIT}/run, 10,000/month)`);
  if (uncachedCount > API_CALL_LIMIT) {
    console.warn(`WARNING: ${uncachedCount} uncached ZIPs exceeds per-run limit of ${API_CALL_LIMIT}.`);
    console.warn(`Only the first ${API_CALL_LIMIT} will be fetched. Run again for the rest.`);
  }

  let totalListings = 0;

  for (const [metro, zips] of Object.entries(metros)) {
    if (!zips) continue;
    console.log(`\n=== ${metro.toUpperCase()} ===`);

    const cacheDir = path.join(process.cwd(), "data", "rentcast", metro);
    fs.mkdirSync(cacheDir, { recursive: true });

    for (const zip of zips) {
      const result = await fetchZip(zip, cacheDir);
      totalListings += result.listings;

      // Rate limit: 1 second between actual API calls
      if (!result.fromCache && apiCallsMade < API_CALL_LIMIT) {
        await sleep(1000);
      }
    }
  }

  console.log(`\n=== SUMMARY ===`);
  console.log(`Total listings fetched: ${totalListings}`);
  console.log(`API calls made this run: ${apiCallsMade}`);
  console.log(`Remaining budget this run: ${Math.max(0, API_CALL_LIMIT - apiCallsMade)}`);
  console.log(`Cache dir: data/rentcast/`);
}

main().catch((err) => {
  console.error("Fetch failed:", err);
  process.exit(1);
});
