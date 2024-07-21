import { handleLineBreaks } from "./handleLineBreaks.js";

function getCoordinates(element, $) {
  const offset = $(element).offset();
  const width = $(element).outerWidth();
  return { left: offset.left, right: offset.left + width };
}

function mergeZonesIntoColumns(zones, $) {
  const columns = [];
  let currentColumn = null;

  zones.forEach((zone) => {
    const { left, right } = getCoordinates(zone, $);
    if (
      currentColumn &&
      Math.abs(currentColumn.left - left) <= currentColumn.width * 0.1 &&
      Math.abs(currentColumn.right - right) <= currentColumn.width * 0.1
    ) {
      currentColumn.zones.push(zone);
    } else {
      if (currentColumn) {
        columns.push(currentColumn);
      }
      currentColumn = { left, right, width: right - left, zones: [zone] };
    }
  });

  if (currentColumn) {
    columns.push(currentColumn);
  }

  return columns;
}

function simplifyColumnTree(columns) {
  const simplifiedColumns = [];

  columns.forEach((column) => {
    if (simplifiedColumns.length > 0) {
      const lastColumn = simplifiedColumns[simplifiedColumns.length - 1];
      if (
        Math.abs(lastColumn.left - column.left) <= lastColumn.width * 0.1 &&
        Math.abs(lastColumn.right - column.right) <= lastColumn.width * 0.1
      ) {
        lastColumn.zones.push(...column.zones);
      } else {
        simplifiedColumns.push(column);
      }
    } else {
      simplifiedColumns.push(column);
    }
  });

  return simplifiedColumns;
}

export async function generateColumnTree(zones, $) {
  zones = handleLineBreaks(zones, $);

  const columns = mergeZonesIntoColumns(zones, $);

  const simplifiedColumns = simplifyColumnTree(columns);

  return simplifiedColumns;
}
