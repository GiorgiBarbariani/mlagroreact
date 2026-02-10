import { cadastralService } from '../services/cadastralService';

export async function testCadastralFetch() {
  console.log('Testing cadastral data fetch from maps.gov.ge...\n');

  // Test 1: Search by specific cadastral code
  console.log('Test 1: Searching for cadastral code 01.72.14.013');
  const parcel1 = await cadastralService.searchByCadastralCode('01.72.14.013');
  if (parcel1) {
    console.log('✅ Found parcel:', {
      code: parcel1.cadastralCode,
      area: `${(parcel1.area / 10000).toFixed(4)} hectares`,
      municipality: parcel1.municipality,
      village: parcel1.village
    });
  } else {
    console.log('❌ Parcel not found');
  }

  // Test 2: Get parcels in Tbilisi area
  console.log('\nTest 2: Getting parcels in Tbilisi area (limited to 5)');
  const tbilisiParcels = await cadastralService.getParcelsByBoundingBox(
    44.7, // min longitude
    41.65, // min latitude
    44.85, // max longitude
    41.75, // max latitude
    5 // limit to 5 parcels
  );

  if (tbilisiParcels.length > 0) {
    console.log(`✅ Found ${tbilisiParcels.length} parcels in Tbilisi area:`);
    tbilisiParcels.forEach(parcel => {
      console.log(`  - ${parcel.cadastralCode}: ${(parcel.area / 10000).toFixed(4)} ha`);
    });
  } else {
    console.log('❌ No parcels found in Tbilisi area');
  }

  // Test 3: Get parcel at specific location (near Tbilisi)
  console.log('\nTest 3: Getting parcel at specific coordinates (41.7151, 44.8271)');
  const locationParcel = await cadastralService.getParcelAtLocation(41.7151, 44.8271);
  if (locationParcel) {
    console.log('✅ Found parcel at location:', {
      code: locationParcel.cadastralCode,
      area: `${(locationParcel.area / 10000).toFixed(4)} hectares`,
      municipality: locationParcel.municipality
    });
  } else {
    console.log('❌ No parcel found at this location');
  }

  console.log('\n✨ Testing complete!');
  return {
    singleSearch: parcel1,
    areaSearch: tbilisiParcels,
    locationSearch: locationParcel
  };
}

// Run the test when this module is imported
testCadastralFetch().then(results => {
  console.log('\nTest Results Summary:', {
    singleSearchSuccess: !!results.singleSearch,
    parcelsFoundInArea: results.areaSearch.length,
    locationSearchSuccess: !!results.locationSearch
  });
}).catch(error => {
  console.error('Test failed:', error);
});