import React, { useMemo, useEffect, useState } from "react";
import { useTable } from "react-table";
import chroma from "chroma-js";
import "./heatmap-table.css"; // Import the CSS file

const Table = ({ shapeData }) => {
  const chromaScale = chroma.scale(['#CC0000', '#FF8585', '#BFBFBF', '#C2EBC2', '#66CC66']).domain([-1, 1]); // Adjust domain for color scale

  const metric = useMemo(() => Object.keys(shapeData.metrics)[0].split("_")[1], [shapeData.metrics]);

  const period = useMemo(() => shapeData.axes[1].dimensions[0].unit, [shapeData.axes]);

  const convertToPercent = ["top2Box", "topBox"].includes(metric);

  // Get data only for the current year and add average of last year as first column
  const data = useMemo(() => getDataWithCurrentYearAndLastYearAverage(shapeData.data, period), [shapeData.data, period]);

  const columns = useMemo(() => {
    if (!data || data.length === 0) return [];
    return Object.keys(data[0]).map(key => ({
      Header: key,
      accessor: key
    }));
  }, [data]);

  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } = useTable({ columns, data });

  const convertDecimalToPercentageWithinCell = value => isNaN(value) ? value : `${Math.round(value * 100)}%`;

  const [improvements, setImprovements] = useState({
    biggestImprovement: {},
    biggestDecrease: {},
    highestScoring: {},
    lowestScoring: {}
  });

  useEffect(() => {
    const newImprovements = {
      biggestImprovement: findBiggestImprovement(rows),
      biggestDecrease: findBiggestDecrease(rows),
      highestScoring: findHighestScoringThisPeriod(rows),
      lowestScoring: findLowestScoringThisPeriod(rows)
    };
    setImprovements(newImprovements);
  }, [rows]);

  const calculatePercentageChange = (row) => {
    if (!row.original) return "";
    const lastIndex = row.cells.length - 1;
    if (lastIndex < 1) return "";

    const currentPeriodValue = row.cells[lastIndex].value;
    const previousPeriodValue = row.cells[lastIndex - 1].value;
    const percentageChange = ((currentPeriodValue - previousPeriodValue) / previousPeriodValue) * 100;

    return percentageChange ? `(${percentageChange.toFixed(2)}%)` : "";
  };

  const calculatePercentage = (row) => {
    if (!row.original) return "";
    const lastIndex = row.cells.length - 1;
    if (lastIndex < 0) return "";

    const currentValue = row.cells[lastIndex].value;
    return currentValue ? `(${(currentValue * 100).toFixed(2)}%)` : "";
  };

  return (
    <div className="table-container">
      <table {...getTableProps()} className="table">
        <thead>
          {headerGroups.map(headerGroup => (
            <tr {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map(column => (
                <th {...column.getHeaderProps()}>{column.render("Header")}</th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody {...getTableBodyProps()}>
          {rows.map((row, i) => {
            prepareRow(row);
            return (
              <tr {...row.getRowProps()} className={i % 2 === 0 ? "even-row" : "odd-row"}>
                {row.cells.map((cell, j) => {
                  const isNumericColumn = j > 0;
                  const backgroundColor = j === 0
                    ? "#ffffff" 
                    : chromaScale((cell.value - row.cells[j - 1].value) * 100).hex(); 

                  const fontColor = chroma(backgroundColor).luminance() < 0.5 ? '#ffffff' : '#000000';
                  const previousValue = j > 0 ? row.cells[j - 1].value : null;
                  const change = previousValue !== null && isNumericColumn ? (cell.value - previousValue).toFixed(2) : null;

                  return (
                    <td
                      {...cell.getCellProps()}
                      style={{
                        background: backgroundColor,
                        color: fontColor,
                        whiteSpace: j === 0 ? 'nowrap' : 'normal',
                        overflow: j === 0 ? 'hidden' : 'visible',
                        textOverflow: j === 0 ? 'ellipsis' : 'clip',
                        maxWidth: j === 0 ? '250px' : 'auto',
                        cursor: j === 0 ? 'pointer' : 'default',
                        textAlign: 'center',
                        verticalAlign: 'middle'
                      }}
                      title={j === 0 ? cell.value : undefined}
                    >
                      {j === 0 ? cell.value : (
                        <>
                          {convertToPercent ? convertDecimalToPercentageWithinCell(cell.value) : cell.value}
                          {change !== null && change != NaN && isNumericColumn && change !== "NaN" && (
                            <span style={{ fontSize: '0.8em', marginLeft: '5px' }}>
                              ({change})
                            </span>
                          )}
                        </>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
          <tr>
            <td colSpan={columns.length} style={headlineStyle}>
              <strong style={headlineTitleStyle}>Headlines (latest month vs last month):</strong>
              <ul style={headlineListStyle}>
                <li style={headlineItemStyle}>
                  <strong>Biggest Improvement:</strong>{" "}
                  <span style={greenTextStyle}>
                    {improvements.biggestImprovement.original?.Field || ""}
                  </span>{" "}
                  {calculatePercentageChange(improvements.biggestImprovement)}
                </li>
                <li style={headlineItemStyle}>
                  <strong>Biggest Decrease:</strong>{" "}
                  <span style={redTextStyle}>
                    {improvements.biggestDecrease.original?.Field || ""}
                  </span>{" "}
                  {calculatePercentageChange(improvements.biggestDecrease)}
                </li>
                <li style={headlineItemStyle}>
                  <strong>Highest Scoring:</strong>{" "}
                  <span style={greenTextStyle}>
                    {improvements.highestScoring.original?.Field || ""}
                  </span>{" "}
                  {calculatePercentage(improvements.highestScoring)}
                </li>
                <li style={headlineItemStyle}>
                  <strong>Lowest Scoring:</strong>{" "}
                  <span style={redTextStyle}>
                    {improvements.lowestScoring.original?.Field || ""}
                  </span>{" "}
                  {calculatePercentage(improvements.lowestScoring)}
                </li>
              </ul>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default Table;

// Helper functions

function formatDate(date, period) {
  function getQuarter(month) {
    if (month <= 2) return 'Q1';
    else if (month <= 5) return 'Q2';
    else if (month <= 8) return 'Q3';
    else return 'Q4';
  }

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const year = date.getFullYear().toString().slice(-2); // Get last two digits of the year
  const month = date.getMonth(); // 0-indexed, so Jan is 0 and Dec is 11

  switch (period) {
    case 'year':
      return year.toString();
    case 'month':
      return `${monthNames[month]} - ${year}`;
    case 'quarter':
      const quarter = getQuarter(month);
      return `${quarter} - ${year}`;
    default:
      return 'Invalid format';
  }
}

// Function to get data only for current year and add last year's average
const getDataWithCurrentYearAndLastYearAverage = (data, period) => {
  const currentYear = new Date().getFullYear();
  const lastYear = currentYear - 1;

  // Map dates for current year
  const datesForCurrentYear = data[0].children
    .map(child => new Date(child.id))
    .filter(date => date.getFullYear() === currentYear)
    .map(date => formatDate(date, period));

  // Map dates for last year
  const datesForLastYear = data[0].children
    .map(child => new Date(child.id))
    .filter(date => date.getFullYear() === lastYear);

  return data.map(hospital => {
    const rowData = { Field: hospital.id };

    // Calculate average for last year
    const lastYearValues = datesForLastYear.map(date => {
      const child = hospital.children.find(item => new Date(item.id).getTime() === date.getTime());
      return child ? parseFloat(child.value) : null;
    }).filter(val => val !== null);

    rowData['Avg Last Year'] = lastYearValues.length > 0
      ? (lastYearValues.reduce((acc, val) => acc + val, 0) / lastYearValues.length).toFixed(2)
      : null;

    // Populate current year data
    datesForCurrentYear.forEach(date => {
      const child = hospital.children.find(item => formatDate(new Date(item.id), period) === date);
      rowData[date] = child ? parseFloat(child.value) : null;
    });

    return rowData;
  });
};

const findBiggestImprovement = (rows) => {
  let biggestImprovement = { value: -Infinity, row: {} };

  rows.forEach(row => {
    const lastIndex = row.cells.length - 1;
    if (lastIndex > 0) {
      const improvement = row.cells[lastIndex].value - row.cells[lastIndex - 1].value;
      if (improvement > biggestImprovement.value) {
        biggestImprovement.value = improvement;
        biggestImprovement.row = row;
      }
    }
  });

  return biggestImprovement.row;
};

const findBiggestDecrease = (rows) => {
  let biggestDecrease = { value: -Infinity, row: {} };

  rows.forEach(row => {
    const lastIndex = row.cells.length - 1;
    if (lastIndex > 0) {
      const decrease = row.cells[lastIndex - 1].value - row.cells[lastIndex].value;
      if (decrease > biggestDecrease.value) {
        biggestDecrease.value = decrease;
        biggestDecrease.row = row;
      }
    }
  });

  return biggestDecrease.row;
};

const findHighestScoringThisPeriod = (rows) => {
  let highestScoringRow = {};
  let highestValue = -Infinity;

  rows.forEach(row => {
    const lastIndex = row.cells.length - 1;
    if (lastIndex >= 0) {
      const currentValue = row.cells[lastIndex].value;
      if (currentValue > highestValue) {
        highestValue = currentValue;
        highestScoringRow = row;
      }
    }
  });

  return highestScoringRow;
};

const findLowestScoringThisPeriod = (rows) => {
  let lowestScoringRow = {};
  let lowestValue = Infinity;

  rows.forEach(row => {
    const lastIndex = row.cells.length - 1;
    if (lastIndex >= 0) {
      const currentValue = row.cells[lastIndex].value;
      if (currentValue < lowestValue) {
        lowestValue = currentValue;
        lowestScoringRow = row;
      }
    }
  });

  return lowestScoringRow;
};

// Styles
const headlineStyle = { padding: "10px" };
const headlineTitleStyle = { fontSize: "1rem", marginBottom: "0.5rem", display: "block" };
const headlineListStyle = { listStyleType: "none", padding: 0 };
const headlineItemStyle = { marginBottom: "0.5rem" };
const greenTextStyle = { color: "green" };
const redTextStyle = { color: "red" };
