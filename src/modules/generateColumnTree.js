function generateColumnTree(zones, tolerance = 0.1) {
  const columns = [];
  zones.forEach((zone) => {
    if (zone.type === "block") {
      const left = zone.rect.left;
      const right = zone.rect.right;
      const width = zone.rect.width;
      const toleranceValue = width * tolerance;

      let column = columns.find(
        (col) =>
          (Math.abs(col.rect.left - left) <= toleranceValue &&
            Math.abs(col.rect.right - right) <= toleranceValue) ||
          (Math.abs(col.rect.left - left) >= toleranceValue &&
            Math.abs(col.rect.right - right) >= toleranceValue)
      );

      if (!column) {
        column = {
          type: "column",
          rect: { left, right },
          zones: [],
        };
        columns.push(column);
      }

      column.zones.push(zone);

      if (zone.children && zone.children.length > 0) {
        const childColumns = generateColumnTree(zone.children, tolerance);
        childColumns.forEach((childColumn) => {
          let column = columns.find(
            (col) =>
              Math.abs(col.rect.left - childColumn.rect.left) <=
                toleranceValue &&
              Math.abs(col.rect.right - childColumn.rect.right) <=
                toleranceValue
          );

          if (!column) {
            column = {
              type: "column",
              rect: childColumn.rect,
              zones: [],
            };
            columns.push(column);
          }

          column.zones.push(...childColumn.zones);
        });
      }
    } else if (zone.type === "inline") {
      let column = {
        type: "column",
        rect: zones[0].rect,
        zones: [],
      };
      column.zones.push(...zones);
      columns.push(column);
    }
  });

  return columns;
}
module.exports = generateColumnTree;
