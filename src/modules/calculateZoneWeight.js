function calculateZoneWeight(zone) {
  if (zone.children.length === 0) {
    return zone.text.split(" ").length;
  }

  let weight = zone.text.split(" ").length;
  zone.children.forEach((child) => {
    weight += calculateZoneWeight(child);
  });
  return weight;
}

module.exports = calculateZoneWeight;
