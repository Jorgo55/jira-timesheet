let issues;
let customFields;
const baseUrl = window.location.origin;
let loggedUser;
let selectedTimeUnit = "--";
let calcTime = 0;

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

function secondsToJiraTime(seconds) {
  const jiraDaySeconds = 8 * 60 * 60;

  const weeks = Math.floor(seconds / (5 * jiraDaySeconds));
  seconds -= weeks * 5 * jiraDaySeconds;

  const days = Math.floor(seconds / jiraDaySeconds);
  seconds -= days * jiraDaySeconds;

  const hours = Math.floor(seconds / 3600);
  seconds -= hours * 3600;

  const minutes = Math.floor(seconds / 60);
  seconds -= minutes * 60;

  const result = [];
  if (weeks > 0) result.push(weeks + "w");
  if (days > 0) result.push(days + "d");
  if (hours > 0) result.push(hours + "h");
  if (minutes > 0) result.push(minutes + "m");
  if (seconds > 0) result.push(seconds + "s");

  return result.join(" ");
}

function changeTimeUnit(value) {
  selectedTimeUnit = value;
  const tableBody = document.getElementById("table-body");
  while (tableBody.firstChild) {
    tableBody.removeChild(tableBody.firstChild);
  }
  displayIssues(value);
}
function convertSecondsToJiraTime(seconds, timeUnit) {
  const jiraDaySeconds = 8 * 60 * 60;

  if (timeUnit === "hours") {
    const days = seconds / jiraDaySeconds;
    return `${days.toFixed(2) * 8}h`;
  } else if (timeUnit === "weeks") {
    const days = seconds / (jiraDaySeconds * 5);
    return `${days.toFixed(2) * 1}w`;
  } else if (timeUnit === "days") {
    const days = seconds / jiraDaySeconds;
    return `${days.toFixed(2) * 1}d`;
  }
}

function getWorkLogs(key) {
  return fetch(baseUrl + "/rest/api/2/issue/" + key + "/worklog").then(
    (response) => response.json()
  );
}
async function displayIssues(val) {
  const divison1 = document.getElementById("division1");
  const divison2 = document.getElementById("division2");

  divison1.innerHTML = customFields?.[0].name;
  divison2.innerHTML = customFields?.[1].name;

  const tableBody = document.getElementById("table-body");
  for (const issue of issues.issues) {
    let workLogsResponse = await getWorkLogs(issue.key);

    workLogsResponse.worklogs.forEach(function (worklog) {
      if (
        (worklog?.author?.name == loggedUser.name || loggedUser.name == "admin",
        "user1",
        "user2")
      ) {
        const row = tableBody.insertRow();

        const keyCell = row.insertCell(0);
        keyCell.textContent = issue.key;

        const createdCell = row.insertCell(1);
        createdCell.textContent = worklog?.created
          ? worklog?.created.substring(0, 10)
          : "";

        const timeSpentCell = row.insertCell(2);
        if (val == undefined || val == "--") {
          timeSpentCell.textContent = worklog?.timeSpent
            ? worklog?.timeSpent
            : "";
          timeSpentCell.id = worklog?.timeSpentSeconds;
        } else {
          timeSpentCell.textContent = worklog?.timeSpentSeconds
            ? convertSecondsToJiraTime(worklog?.timeSpentSeconds, val)
            : "";
          timeSpentCell.id = worklog?.timeSpentSeconds;
        }

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
        customField1Cell.textContent = issue?.fields?.[customFields?.[0].id]
          ? issue?.fields?.[customFields?.[0].id]
          : null;

        const customField2Cell = row.insertCell(7);
        customField2Cell.textContent = issue?.fields?.[customFields?.[1].id]
          ? issue?.fields?.[customFields?.[1].id]
          : null;
      }
    });
  }
}

async function getIssues(assigneeName) {
  try {
    const CFresponse = await fetch(baseUrl + "/rest/api/2/field");
    const fields = await CFresponse.json();
    customFields = fields.filter((field) => field.custom);
    if (typeof assigneeName != "string") {
      const userResp = await fetch(baseUrl + "/rest/api/2/myself");
      loggedUser = await userResp.json();
    } else {
      loggedUser.name = assigneeName;
    }
    let issuesURL;
    if ((loggedUser.name == "admin", "user1", "user2")) {
      issuesURL =
        baseUrl +
        "/rest/api/2/search?&fields=id,project," +
        customFields?.[0].id +
        "," +
        customFields?.[1].id;
    } else {
      issuesURL =
        baseUrl +
        "/rest/api/2/search?jql=worklogAuthor%20%3D%20" +
        loggedUser.name;
    }
    const response = await fetch(issuesURL);
    issues = await response.json();
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
  getIssues();
}

function searchByAsignee() {
  const assigneeText = document.getElementById("asignee").value.toLowerCase();

  const tableBody = document.getElementById("table-body");
  while (tableBody.firstChild) {
    tableBody.removeChild(tableBody.firstChild);
  }
  getIssues(assigneeText);
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
function calculateTime() {
  const tableBody = document.getElementById("table-body");
  const rowss = Array.from(tableBody.rows);
  let sum = 0;
  rowss.forEach((row) => {
    const timeSpentCell = row.cells[2].id;
    sum += Math.floor(timeSpentCell);
  });
  const calcTimeContainer = document.getElementById("calcTimeContainer");
  calcTimeContainer.innerHTML =
    selectedTimeUnit !== "--"
      ? convertSecondsToJiraTime(sum, selectedTimeUnit)
      : secondsToJiraTime(sum);
}

window.onload = getIssues;
