import React, { useEffect, useState } from "react";
import {
  initializeBlock,
  useBase,
  useRecords,
  Button,
  Box,
  Dialog,
  Heading,
  Text,
  InputSynced,
  FormField,
  TablePickerSynced,
  FieldPickerSynced,
  useGlobalConfig,
  Select,
  SelectButtons,
  expandRecord,
  TextButton,
  registerRecordActionDataCallback,
  Tooltip,
  Label,
} from "@airtable/blocks/ui";
import { detectSentiment, detectTags } from "./api";
import { FieldType } from "@airtable/blocks/models";

const Sentiment = Object.freeze({
  LOW: "LOW",
  HIGH: "HIGH",
  MEDIUM: "MEDIUM",
  CRITICAL: "CRITICAL",
});
function AWSSetupForm({ setConfigModalOpen, error, setError }) {
  const base = useBase();
  const globalConfig = useGlobalConfig();

  return (
    <Dialog
      style={{
        display: "grid",
        gridGap: "10px",
      }}
      onClose={() => setConfigModalOpen(false)}
      width="400px"
    >
      <Heading textAlign="center">Configure AWS API credentials</Heading>
      <Text variant="paragraph">
        You need to configure your AWS credentials for this app to work.
      </Text>
      <InputSynced
        globalConfigKey="awsRegion"
        placeholder="AWS Region. Example: us-east-1"
      />
      <InputSynced
        globalConfigKey="accessKey"
        placeholder="AWS Access Key ID"
      />
      <InputSynced
        globalConfigKey="secretKey"
        placeholder="AWS Secret Access Key"
      />
      <FormField label="Table for Source data">
        <TablePickerSynced globalConfigKey="tableId" />
      </FormField>
      <FormField
        label="Field which has Source Text to be used for Sentiment Analysis"
        marginBottom={0}
      >
        <FieldPickerSynced
          globalConfigKey="selectedFieldId"
          table={base.getTableByIdIfExists(globalConfig.get("tableId"))}
          placeholder="Pick a 'text' field..."
          allowedTypes={[FieldType.MULTILINE_TEXT, FieldType.SINGLE_LINE_TEXT]}
        />
      </FormField>
      <Text style={{ color: "red" }} textAlign="center">
        {error}
      </Text>
      <Button
        onClick={() => {
          if (
            !(
              globalConfig.get("awsRegion") &&
              globalConfig.get("accessKey") &&
              globalConfig.get("secretKey") &&
              globalConfig.get("tableId") &&
              globalConfig.get("selectedFieldId")
            )
          ) {
            setError("Please fill all the fields");
            setConfigModalOpen(true);
          } else {
            setConfigModalOpen(false);
          }
        }}
        variant="primary"
        margin="10px"
      >
        Done
      </Button>
    </Dialog>
  );
}

function AirDeskBlock() {
  const [configModalOpen, setConfigModalOpen] = useState(true);
  const globalConfig = useGlobalConfig();
  const base = useBase();
  const table = base.getTableByName("Tickets");
  const records = useRecords(table);
  const sortOptions = [
    { value: "sentiment", label: "Sentiment" },
    { value: "date", label: "Date" },
  ];
  const [sortValue, setSortValue] = useState(sortOptions[0].value);
  const filterOptions = [
    { value: "open", label: "Open Tickets" },
    { value: "all", label: "All Tickets" },
    { value: "unassigned", label: "Unassigned" },
    { value: "highPriority", label: "High Priority" },
  ];
  const [filterValue, setFilterValue] = useState(filterOptions[0].value);
  const [error, setError] = useState("");

  useEffect(() => {
    if (
      !(
        globalConfig.get("awsRegion") &&
        globalConfig.get("accessKey") &&
        globalConfig.get("secretKey") &&
        globalConfig.get("tableId") &&
        globalConfig.get("selectedFieldId")
      )
    ) {
      setConfigModalOpen(true);
    }

    const tempFieldId = globalConfig.get("selectedFieldId");

    if (tempFieldId) {
      records.forEach((record) => {
        const tempText = record.getCellValue(tempFieldId);
        if (tempText && !record.getCellValue("Sentiment")) {
          detectSentiment(tempText).then((result) => {
            const resSentiment = result.sentiment.Sentiment;
            table.updateRecordAsync(record.id, {
              Sentiment: {
                name:
                  resSentiment == "NEGATIVE"
                    ? "CRITICAL"
                    : resSentiment == "NEUTRAL"
                    ? "HIGH"
                    : resSentiment == "MIXED"
                    ? "MEDIUM"
                    : "LOW",
              },
            });
          });
        }

        if (tempText && !record.getCellValue("Tags")) {
          detectTags(tempText).then((result) => {
            const tempKeyPhrases = result.tags.KeyPhrases.map((keyPhrase) =>
              keyPhrase.Text.replace("the ", "")
            );

            table.updateRecordAsync(record.id, {
              Tags: tempKeyPhrases.join(", "),
            });
          });
        }
      });
    }
  });

  if (configModalOpen) {
    return (
      <AWSSetupForm
        setConfigModalOpen={setConfigModalOpen}
        error={error}
        setError={setError}
      />
    );
  }

  return (
    <Box height="500px" border="thick" backgroundColor="lightGray1">
      <Records
        records={records}
        setConfigModalOpen={setConfigModalOpen}
        setSortValue={setSortValue}
        sortValue={sortValue}
        sortOptions={sortOptions}
        filterValue={filterValue}
        setFilterValue={setFilterValue}
        filterOptions={filterOptions}
      />
    </Box>
  );
}

function Records({
  records,
  setConfigModalOpen,
  setSortValue,
  sortValue,
  sortOptions,
  filterValue,
  setFilterValue,
  filterOptions,
}) {
  const globalConfig = useGlobalConfig();
  return (
    <Box marginY={3}>
      <Heading
        textAlign="center"
        variant="caps"
        size="xlarge"
        style={{ color: "#0e83db" }}
      >
        AirDesk
      </Heading>
      <Box margin={4}>
        <Box
          width="25%"
          display="inline-block"
          paddingLeft="8%"
          paddingRight="8%"
        >
          <Tooltip
            content="Resolved + Unresolved tickets"
            placementX={Tooltip.placements.CENTER}
            placementY={Tooltip.placements.BOTTOM}
            shouldHideTooltipOnClick={true}
          >
            <Box
              width={100}
              height={70}
              boxShadow="0 2px 4px 0 rgba(0,0,0,0.2)"
              transition="0.3s"
              textAlign="center"
              padding="1"
            >
              <Text
                fontSize={2}
                marginBottom="2"
                style={{ fontSize: "10px", fontWeight: 600, color: "#0e83db" }}
              >
                TOTAL TICKETS
              </Text>
              <Heading style={{ fontWeight: 800, color: "#0e83db" }}>
                {records.length}
              </Heading>
            </Box>
          </Tooltip>
        </Box>
        <Box
          width="25%"
          display="inline-block"
          paddingLeft="8%"
          paddingRight="8%"
        >
          <Tooltip
            content="Unresolved Tickets"
            placementX={Tooltip.placements.CENTER}
            placementY={Tooltip.placements.BOTTOM}
            shouldHideTooltipOnClick={true}
          >
            <Box
              width={100}
              height={70}
              boxShadow="0 2px 4px 0 rgba(0,0,0,0.2)"
              transition="0.3s"
              textAlign="center"
              padding="1"
            >
              <Text
                fontSize={2}
                marginBottom="2"
                style={{ fontSize: "10px", fontWeight: 600, color: "#0e83db" }}
              >
                OPEN TICKETS
              </Text>
              <Heading style={{ fontWeight: 800, color: "#0e83db" }}>
                {
                  records.filter((record) => {
                    if (
                      record.getCellValue("Text") &&
                      !record.getCellValue("isResolved")
                    ) {
                      return record;
                    }
                  }).length
                }
              </Heading>
            </Box>
          </Tooltip>
        </Box>
        <Box
          width="25%"
          display="inline-block"
          paddingLeft="8%"
          paddingRight="8%"
        >
          <Tooltip
            content="Tickets with no Collaborator"
            placementX={Tooltip.placements.CENTER}
            placementY={Tooltip.placements.BOTTOM}
            shouldHideTooltipOnClick={true}
          >
            <Box
              width={100}
              height={70}
              boxShadow="0 2px 4px 0 rgba(0,0,0,0.2)"
              transition="0.3s"
              textAlign="center"
              padding="1"
            >
              <Text
                fontSize={2}
                marginBottom="2"
                style={{ fontSize: "10px", fontWeight: 600, color: "#0e83db" }}
              >
                UNASSIGNED
              </Text>
              <Heading style={{ fontWeight: 800, color: "#0e83db" }}>
                {
                  records.filter((record) => {
                    return record.getCellValue(
                      globalConfig.get("selectedFieldId")
                    ) &&
                      !record.getCellValue("isResolved") &&
                      !record.getCellValue("AssignedTo")
                      ? record
                      : null;
                  }).length
                }
              </Heading>
            </Box>
          </Tooltip>
        </Box>
        <Box
          width="25%"
          display="inline-block"
          paddingLeft="8%"
          paddingRight="8%"
        >
          <Tooltip
            content="Critical or High Priority Tickets"
            placementX={Tooltip.placements.CENTER}
            placementY={Tooltip.placements.BOTTOM}
            shouldHideTooltipOnClick={true}
          >
            <Box
              width={100}
              height={70}
              boxShadow="0 2px 4px 0 rgba(0,0,0,0.2)"
              transition="0.3s"
              textAlign="center"
              padding="1"
            >
              <Text
                fontSize={2}
                marginBottom="2"
                style={{ fontSize: "10px", fontWeight: 600, color: "#0e83db" }}
              >
                HIGH PRIORITY
              </Text>
              <Heading style={{ fontWeight: 800, color: "#0e83db" }}>
                {
                  records.filter((record) => {
                    return record.getCellValue(
                      globalConfig.get("selectedFieldId")
                    ) &&
                      !record.getCellValue("isResolved") &&
                      record.getCellValue("Sentiment") &&
                      (record.getCellValue("Sentiment").name ==
                        Sentiment.CRITICAL ||
                        record.getCellValue("Sentiment").name == Sentiment.HIGH)
                      ? record
                      : null;
                  }).length
                }
              </Heading>
            </Box>
          </Tooltip>
        </Box>
      </Box>
      <Box marginBottom={5} paddingBottom="1px">
        <Box style={{ float: "right" }}>
          <Button
            onClick={() => setConfigModalOpen(true)}
            margin={2}
            size="small"
            icon="settings"
            variant="primary"
            style={{ float: "right", marginRight: "5px" }}
          >
            Settings
          </Button>

          <SelectButtons
            value={sortValue}
            onChange={(newValue) => setSortValue(newValue)}
            options={sortOptions}
            width="200px"
            style={{ margin: "7px", float: "right" }}
          />
          <Heading
            size="small"
            style={{
              float: "right",
              padding: "5px",
              margin: "10px 0 10px 10px",
            }}
            variant="caps"
          >
            Sort
          </Heading>
          <Select
            value={filterValue}
            onChange={(newValue) => setFilterValue(newValue)}
            options={filterOptions}
            width="120px"
            style={{ margin: "7px", float: "right" }}
          />
          <Heading
            size="small"
            style={{
              float: "right",
              padding: "5px",
              margin: "10px 0 10px 10px",
            }}
            variant="caps"
          >
            Filter
          </Heading>
        </Box>
      </Box>
      <table
        style={{ borderCollapse: "collapse", width: "100%", margin: "5px" }}
      >
        <thead>
          <tr>
            <td></td>
            <td
              style={{
                whiteSpace: "nowrap",
                verticalAlign: "bottom",
              }}
            >
              <Heading
                variant="caps"
                size="xsmall"
                marginRight={3}
                marginBottom={0}
              >
                Sentiment
              </Heading>
            </td>
            <td style={{ width: "20%", verticalAlign: "bottom" }}>
              <Heading
                variant="caps"
                size="xsmall"
                marginRight={3}
                marginBottom={0}
              >
                Assigned To
              </Heading>
            </td>
            <td style={{ width: "50%", verticalAlign: "bottom" }}>
              <Heading variant="caps" size="xsmall" marginBottom={0}>
                Ticket Detail
              </Heading>
            </td>
          </tr>
        </thead>
        <tbody>
          {records
            .sort((a, b) => {
              if (sortValue == "date") {
                return (
                  new Date(b.getCellValue("CreatedDate")) -
                  new Date(a.getCellValue("CreatedDate"))
                );
              } else {
                if (
                  !(a.getCellValue("Sentiment") && b.getCellValue("Sentiment"))
                ) {
                  return -10;
                }
                const aSentiment = a.getCellValue("Sentiment").name;
                const bSentiment = b.getCellValue("Sentiment").name;
                const x =
                  aSentiment == Sentiment.CRITICAL
                    ? 4
                    : aSentiment == Sentiment.HIGH
                    ? 3
                    : aSentiment == Sentiment.MEDIUM
                    ? 2
                    : 1;
                const y =
                  bSentiment == Sentiment.CRITICAL
                    ? 4
                    : bSentiment == Sentiment.HIGH
                    ? 3
                    : bSentiment == Sentiment.MEDIUM
                    ? 2
                    : 1;
                return y - x;
              }
            })
            .filter((record) => {
              if (filterValue == "unassigned") {
                return record.getCellValue(
                  globalConfig.get("selectedFieldId")
                ) &&
                  !record.getCellValue("isResolved") &&
                  !record.getCellValue("AssignedTo")
                  ? record
                  : null;
              } else if (filterValue == "highPriority") {
                return record.getCellValue(
                  globalConfig.get("selectedFieldId")
                ) &&
                  !record.getCellValue("isResolved") &&
                  record.getCellValue("Sentiment") &&
                  (record.getCellValue("Sentiment").name ==
                    Sentiment.CRITICAL ||
                    record.getCellValue("Sentiment").name == Sentiment.HIGH)
                  ? record
                  : null;
              } else if (filterValue == "open") {
                return (
                  record.getCellValue(globalConfig.get("selectedFieldId")) &&
                  !record.getCellValue("isResolved")
                );
              }
              return record;
            })
            .map((record) => {
              const tempSentiment = record.getCellValue("Sentiment")
                ? record.getCellValue("Sentiment").name
                : "Loading";
              return (
                <tr key={record.id} style={{ borderTop: "2px solid #ddd" }}>
                  <td>
                    <Tooltip
                      content="Open Record for editing"
                      placementX={Tooltip.placements.CENTER}
                      placementY={Tooltip.placements.BOTTOM}
                      shouldHideTooltipOnClick={true}
                    >
                      <TextButton
                        onClick={() => {
                          expandRecord(record);
                        }}
                        icon="expand"
                        aria-label="expand"
                      />
                    </Tooltip>
                  </td>
                  <td style={{ textAlign: "center", whiteSpace: "nowrap" }}>
                    <Box
                      display="inline-flex"
                      alignItems="center"
                      justifyContent="center"
                      height="25px"
                      marginRight={3}
                      borderRadius="10px"
                      backgroundColor={
                        tempSentiment == Sentiment.LOW
                          ? "green"
                          : tempSentiment == Sentiment.CRITICAL
                          ? "red"
                          : tempSentiment == Sentiment.HIGH
                          ? "blue"
                          : "grey"
                      }
                      textColor="white"
                    >
                      <Text padding="3" textColor="white">
                        {tempSentiment}
                      </Text>
                    </Box>
                  </td>
                  <td style={{ width: "10%" }}>
                    {record.getCellValue("AssignedTo") ? (
                      <div>
                        <div style={{ float: "left", marginRight: "5px" }}>
                          <img
                            src={
                              record.getCellValue("AssignedTo").profilePicUrl
                            }
                            alt=""
                            width="15"
                            height="15"
                          />
                        </div>
                        <div style={{ float: "left" }}>
                          {record.getCellValue("AssignedTo").name}
                        </div>
                      </div>
                    ) : (
                      "Unassigned"
                    )}
                  </td>
                  <td style={{ width: "80%" }}>
                    {globalConfig.get("selectedFieldId")
                      ? record.getCellValue(globalConfig.get("selectedFieldId"))
                      : ""}
                  </td>
                </tr>
              );
            })}
        </tbody>
      </table>
    </Box>
  );
}

initializeBlock(() => <AirDeskBlock />);
