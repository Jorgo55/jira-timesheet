let issues;
let customFields;
const baseUrl = window.location.origin;
function filterIssuesByDateRange() {
  const startDate = document.getElementsByName("issue-start")[0]?.value;
  const endDate = document.getElementsByName("issue-end")[0]?.value;
  const tableBody = document.getElementById("table-body");
  const rows = Array.from(tableBody.rows);
  rows.forEach((row) => {
    const worklogDate = row.cells[1].textContent.trim();
    const firstWorklogTimestamp = Date.parse(worklogDate);
    if (!isNaN(firstWorklogTimestamp)) {
      const startDateTimestamp = Date.parse(startDate);
      const endDateTimestamp = Date.parse(endDate);
      if (
        firstWorklogTimestamp >= startDateTimestamp &&
        firstWorklogTimestamp <= endDateTimestamp
      ) {
        row.style.display = "";
      } else {
        row.style.display = "none";
      }
    }
  });
}
function getWorkLogs(key) {
  return fetch(baseUrl + "/jira/rest/api/2/issue/" + key + "/worklog").then(
    (response) => response.json()
  );
}
async function displayIssues() {
  const divison1 = document.getElementById("division1");
  const divison2 = document.getElementById("division2");
  divison1.innerHTML =
    customFields?.values[0].name +
    '<button id="groupButton" onclick="groupIssuesByCustomField(6)">▽</button> ';
  divison2.innerHTML =
    customFields?.values[1].name +
    ' <button id="groupButton" onclick="groupIssuesByCustomField(7)">▽</button>';
  const tableBody = document.getElementById("table-body");
  for (const issue of issues.issues) {
    let workLogsResponse = await getWorkLogs(issue.key);
    workLogsResponse.worklogs.forEach(function (worklog) {
      const row = tableBody.insertRow();
      const keyCell = row.insertCell(0);
      keyCell.textContent = issue.key;
      const createdCell = row.insertCell(1);
      createdCell.textContent = worklog?.created
        ? worklog?.created.substring(0, 10)
        : "";
      const timeSpentCell = row.insertCell(2);
      timeSpentCell.textContent = worklog?.timeSpent ? worklog?.timeSpent : "";
      const projectNameCell = row.insertCell(3);
      projectNameCell.textContent = issue.fields.project.name
        ? issue.fields.project.name
        : "";
      const summaryCell = row.insertCell(4);
      summaryCell.textContent = worklog?.comment ? worklog?.comment : "";
      const assigneeCell = row.insertCell(5);
      assigneeCell.textContent = worklog?.author?.name
        ? worklog?.author?.name
        : "";
      const customField1Cell = row.insertCell(6);
      customField1Cell.textContent = issue?.fields?.[
        customFields?.values[0].id
      ]?.[0]
        ? issue?.fields?.[customFields?.values[0].id]?.[0]
        : null;
      const customField2Cell = row.insertCell(7);
      customField2Cell.textContent = issue?.fields?.[
        customFields?.values[1].id
      ]?.[0]
        ? issue?.fields?.[customFields?.values[1].id]?.[0]
        : null;
    });
  }
}
async function getIssues() {
  try {
    const response = await fetch(baseUrl + "/jira/rest/api/2/search");
    const CFresponse = await fetch(baseUrl + "/jira/rest/api/2/customFields");
    issues = await response.json();
    customFields = await CFresponse.json();
    await displayIssues();
  } catch (error) {
    console.error("Error:", error);
  }
}
function groupIssuesByCustomField(nr) {
  const tableBody = document.getElementById("table-body");
  const rows = Array.from(tableBody.rows);
  const groups = {};
  rows.forEach((row) => {
    const customField = row.cells[nr].textContent.trim();
    if (!groups[customField]) {
      groups[customField] = [];
    }
    groups[customField].push(row);
  });
  while (tableBody.firstChild) {
    tableBody.removeChild(tableBody.firstChild);
  }
  for (const customFieldValue in groups) {
    if (groups.hasOwnProperty(customFieldValue)) {
      const groupRows = groups[customFieldValue];
      const groupHeaderRow = document.createElement("tr");
      const groupHeaderCell = document.createElement("th");
      console.log(customFieldValue);
      groupHeaderCell.classList =
        customFieldValue.toString() != "<empty string>"
          ? "customGrouping"
          : "none";
      groupHeaderCell.textContent = `${customFieldValue}`;
      groupHeaderCell.colSpan = 8;
      groupHeaderRow.appendChild(groupHeaderCell);
      tableBody.appendChild(groupHeaderRow);
      groupRows.forEach((row) => {
        if (row.cells[nr].firstChild) {
          tableBody.appendChild(row);
        }
      });
    }
  }
}
function clearFilters() {
  const tableBody = document.getElementById("table-body");
  const startDate = document.getElementsByName("issue-start")[0];
  const assigneeText = document.getElementById("asignee");
  const endDate = document.getElementsByName("issue-end")[0];
  while (tableBody.firstChild) {
    tableBody.removeChild(tableBody.firstChild);
  }
  startDate.value = "";
  endDate.value = "";
  assigneeText.value = "";
  displayIssues("Custom Field");
}
function searchByAsignee() {
  const assigneeText = document.getElementById("asignee").value.toLowerCase();
  const tableBody = document.getElementById("table-body");
  const rows = Array.from(tableBody.rows);
  rows.forEach((row) => {
    const assigneeCell = row.cells[5].textContent.toLowerCase();
    if (assigneeCell.includes(assigneeText)) {
      row.style.display = "";
    } else {
      row.style.display = "none";
    }
  });
}
const exportButton = () => {
  const tableRows = document.querySelectorAll("#table-body tr");
  const csvData = [
    [
      "Issue Key",
      "Created",
      "Time Spent",
      "Project Name",
      "Comment",
      "Assignee",
      "Divison 1",
      "Divison 2",
    ],
  ];
  tableRows.forEach((row) => {
    const rowData = [];
    const cells = row.querySelectorAll("td");
    cells.forEach((cell) => {
      rowData.push(cell.textContent.toString());
    });
    csvData.push(rowData);
  });
  const csvContent = csvData.map((row) => row.join(",")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "exported_data.csv";
  link.click();
};
window.onload = getIssues;
