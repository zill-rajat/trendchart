import React from "react";
import { useTable } from "react-table";
import chroma from "chroma-js";
import "./heatmap-table.css"; // Import the CSS file

const Table = ({ shapeData }) => {
  const chromaScale = chroma.scale(['#CC0000', '#FF8585', '#BFBFBF', '#C2EBC2', '#66CC66']).domain([-1, 1]); // Adjust domain for color scale

  const metric = Object.keys(shapeData.metrics)[0].split("_")[1];

  const period = shapeData.axes[1].dimensions[0].unit;

  const convertToPercent = metric === "top2Box" ? true : metric === "topBox" ? true : false;

  const data = getData(shapeData.data, period);

  const columns = React.useMemo(() => {
    if (!data || data.length === 0) return [];
    return Object.keys(data[0]).map(key => ({
      Header: key,
      accessor: key
    }));
  }, [data]);

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow
  } = useTable({ columns, data });

  const generateTableHead = () =>
    headerGroups.map(headerGroup => (
      <tr {...headerGroup.getHeaderGroupProps()}>
        {headerGroup.headers.map(column => (
          <th {...column.getHeaderProps()}>{column.render("Header")}</th>
        ))}
      </tr>
    ));

  const convertDecimalToPercentageWithinCell = value => isNaN(value) ? value : `${Math.round(value * 100)}%`;

  //Biggest improvement (from last Period to current Period)
  const findBiggestImprovement = () => {
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

  const findBiggestDecrease = () => {
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

  const findHighestScoringThisPeriod = () => {
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

  const findLowestScoringThisPeriod = () => {
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
    return currentValue ? `(${currentValue.toFixed(2)*100}%)` : "";
  };

  return (
    <div className="table-container">
      <table {...getTableProps()} className="table">
        <thead>{generateTableHead()}</thead>
        <tbody {...getTableBodyProps()}>
          {rows.map((row, i) => {
            prepareRow(row);
            return (
              <tr
                {...row.getRowProps()}
                className={i % 2 === 0 ? "even-row" : "odd-row"}
              >
                {row.cells.map((cell, j) => (
                  <td
                    {...cell.getCellProps()}
                    style={{
                      background: j === 0
                        ? "#ffffff" // First column background color
                        : chromaScale((cell.value - row.cells[j - 1].value) * 100).hex() // Calculate difference with previous cell value
                    }}
                  >
                    {convertToPercent ? convertDecimalToPercentageWithinCell(cell.value) : cell.value}
                  </td>
                ))}
              </tr>
            );
          })}
          {/* Takeaway Points */}
          <tr>
            <td colSpan={columns.length} style={{ padding: "10px" }}>
              <strong style={{ fontSize: "1rem", marginBottom: "0.5rem", display: "block" }}>Headlines:</strong>
              <ul style={{ listStyleType: "none", padding: 0 }}>
                <li style={{ marginBottom: "0.5rem" }}>
                  <strong>Biggest Improvement:</strong>{" "}
                  <span style={{ color: "green" }}>
                    {findBiggestImprovement().original ? findBiggestImprovement().original.Field : ""}
                  </span>{" "}
                  {calculatePercentageChange(findBiggestImprovement())}
                </li>
                <li style={{ marginBottom: "0.5rem" }}>
                  <strong>Biggest Decrease:</strong>{" "}
                  <span style={{ color: "red" }}>
                    {findBiggestDecrease().original ? findBiggestDecrease().original.Field : ""}
                  </span>{" "}
                  {calculatePercentageChange(findBiggestDecrease())}
                </li>
                <li style={{ marginBottom: "0.5rem" }}>
                  <strong>Highest Scoring:</strong>{" "}
                  <span style={{ color: "green" }}>
                    {findHighestScoringThisPeriod().original ? findHighestScoringThisPeriod().original.Field : ""}
                  </span>{" "}
                  {calculatePercentage(findHighestScoringThisPeriod())}
                </li>
                <li>
                  <strong>Lowest Scoring:</strong>{" "}
                  <span style={{ color: "red" }}>
                    {findLowestScoringThisPeriod().original ? findLowestScoringThisPeriod().original.Field : ""}
                  </span>{" "}
                  {calculatePercentage(findLowestScoringThisPeriod())}
                </li>
              </ul>
            </td>
          </tr>

        </tbody>
      </table>
    </div>
  );
};

// getData function remains the same

export default Table;

// Helper functions
// formatDate function 
function formatDate(date, period) {
  // Helper function to get the quarter
  function getQuarter(month) {
      if (month <= 2) return 'Q1';
      else if (month <= 5) return 'Q2';
      else if (month <= 8) return 'Q3';
      else return 'Q4';
  }

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const year = date.getFullYear();
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

// Function to convert data into desired structure
const getData = (data, period) => {
  const dates = data[0].children.map(child => {
    const date = new Date(child.id);
    return formatDate(date, period);
  });

  const heatmapData = data.map(hospital => {
    const rowData = {};
    rowData['Field'] = hospital.id;
    dates.forEach(date => {
      const child = hospital.children.find(item => {
        const itemDate = new Date(item.id);
        return formatDate(itemDate, period) === date;
      });
      rowData[date] = child ? parseFloat(child.value) : null;
    });
    return rowData;
  });

  return heatmapData;
};
