async function test() {
    const lat = 19.076;
    const lng = 72.8777;
    const radius = 5000;
    const query = `
        [out:json][timeout:10];
        (
          node["amenity"="hospital"](around:${radius},${lat},${lng});
          way["amenity"="hospital"](around:${radius},${lat},${lng});
          node["amenity"="clinic"](around:${radius},${lat},${lng});
          node["healthcare"="hospital"](around:${radius},${lat},${lng});
        );
        out center;
    `;

    try {
        const url = 'https://overpass-api.de/api/interpreter?data=' + encodeURIComponent(query);
        const res = await fetch(url, {
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'MyApp/1.0 (test@example.com)'
            }
        });
        const text = await res.text();
        console.log("STATUS:", res.status);
        console.log("RESPONSE:", text.substring(0, 500));
    } catch (e) {
        console.error(e);
    }
}
test();
