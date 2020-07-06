import React, { useEffect, useState } from "react";
import {
  initializeBlock,
  useBase,
  useRecords,
  RecordCardList,
  Button,
  Box,
  Dialog,
  Heading,
  Text,
  Loader,
  InputSynced,
  FormField,
  TablePickerSynced,
  FieldPickerSynced,
  useGlobalConfig,
  CellRenderer,
  Icon,
  SelectButtons,
  expandRecord,
  TextButton,
} from "@airtable/blocks/ui";
import { detectSentiment, detectTags } from "./api";
import { FieldType } from "@airtable/blocks/models";

const Sentiment = Object.freeze({
  LOW: "LOW",
  HIGH: "HIGH",
  MEDIUM: "MEDIUM",
  CRITICAL: "CRITICAL",
});
function AWSSetupForm({ setConfigModalOpen }) {
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
      <Dialog.CloseButton />
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
        label="Field which has Source Text, Attachment, URL or Video"
        marginBottom={0}
      >
        <FieldPickerSynced
          globalConfigKey="selectedFieldId"
          table={base.getTableByIdIfExists(globalConfig.get("tableId"))}
          placeholder="Pick a 'text' field..."
          allowedTypes={[FieldType.MULTILINE_TEXT, FieldType.SINGLE_LINE_TEXT]}
        />
      </FormField>
      <Button
        onClick={() => setConfigModalOpen(false)}
        variant="primary"
        margin="10px"
      >
        Done
      </Button>
    </Dialog>
  );
}

function SentimentDetectionBlock() {
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const globalConfig = useGlobalConfig();
  const base = useBase();
  const table = base.getTableByName("Tickets");
  const records = useRecords(table);
  const sortOptions = [
    { value: "sentiment", label: "Sentiment" },
    { value: "date", label: "Date" },
  ];
  const [sortValue, setSortValue] = useState(sortOptions[0].value);

  useEffect(() => {
    if (
      !globalConfig.get("awsRegion") ||
      !globalConfig.get("accessKey") ||
      !globalConfig.get("secretKey") ||
      !globalConfig.get("tableId") ||
      !globalConfig.get("selectedFieldId")
    ) {
      setConfigModalOpen(true);
    }

    const tempFieldId = globalConfig.get("selectedFieldId");

    if (tempFieldId) {
      records.forEach((record) => {
        const tempText = record.getCellValue(tempFieldId);
        if (tempText && !record.getCellValue("Sentiment")) {
          detectSentiment(tempText).then((result) => {
            console.log(typeof result.sentiment.Sentiment);
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
        console.log("printing recrod get cell tag");
        console.log(record.getCellValue("Tags"));
        if (tempText && !record.getCellValue("Tags")) {
          console.log("INSIDE printing recrod get cell tag");

          detectTags(tempText).then((result) => {
            const tempKeyPhrases = result.tags.KeyPhrases.map((keyPhrase) =>
              keyPhrase.Text.replace("the ", "")
            );

            table.updateRecordAsync(record.id, {
              Tags: tempKeyPhrases.join(", "),
            });
            console.log(result.tags.KeyPhrases);
          });
        }
      });
    }
    console.log("sortValue");

    console.log(sortValue);

    if (sortValue) {
      console.log(sortValue);
      if (sortValue == "date")
        records.sort(
          (a, b) =>
            new Date(b.getCellValue("CreatedDate")) -
            new Date(a.getCellValue("CreatedDate"))
        );
    }
  });

  if (configModalOpen) {
    return <AWSSetupForm setConfigModalOpen={setConfigModalOpen} />;
  }

  return (
    <Box height="500px" border="thick" backgroundColor="lightGray1">
      {/* <RecordCardList
        onRecordClick={(record) => setSelectedRecord(record)}
        records={records}
      /> */}
      <Records
        records={records}
        setConfigModalOpen={setConfigModalOpen}
        setSortValue={setSortValue}
        sortValue={sortValue}
        sortOptions={sortOptions}
      />
    </Box>
  );
}

function Label({ label, value }) {
  return (
    <div style={{ display: "flex", alignItems: "center", marginBottom: 5 }}>
      <Heading variant="caps" size="xsmall" style={{ margin: "0 10px 0 0" }}>
        {label}:
      </Heading>
      <Text size="large">{value}</Text>
    </div>
  );
}

function Records({
  records,
  setConfigModalOpen,
  setSortValue,
  sortValue,
  sortOptions,
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
        <Box width="10%" display="inline-block" marginLeft={4} marginRight={4}>
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
        </Box>
        <Box width="10%" display="inline-block" marginLeft={4} marginRight={4}>
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
        </Box>
        <Box width="10%" display="inline-block" marginLeft={4} marginRight={4}>
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
                  if (
                    record.getCellValue("Text") &&
                    !record.getCellValue("AssignedTo")
                  ) {
                    return record;
                  }
                }).length
              }
            </Heading>
          </Box>
        </Box>
        <Box width="10%" display="inline-block" marginLeft={4} marginRight={4}>
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
                  if (
                    record.getCellValue("Text") &&
                    record.getCellValue("Sentiment") &&
                    record.getCellValue("Sentiment").name == Sentiment.CRITICAL
                  ) {
                    return record;
                  }
                }).length
              }
            </Heading>
          </Box>
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
          />
        </Box>

        <Heading
          size="small"
          style={{ float: "right", padding: "5px", marginRight: "5px" }}
          variant="caps"
        >
          Sort
        </Heading>
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
          {records.map((record) => {
            if (
              !record.getCellValue(globalConfig.get("selectedFieldId")) ||
              record.getCellValue("isResolved")
            ) {
              return;
            }
            const tempSentiment = record.getCellValue("Sentiment")
              ? record.getCellValue("Sentiment").name
              : "Loading";

            console.log(tempSentiment);
            return (
              <tr key={record.id} style={{ borderTop: "2px solid #ddd" }}>
                <td>
                  <TextButton
                    onClick={() => {
                      expandRecord(record);
                    }}
                    icon="expand"
                  />
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
                          src={record.getCellValue("AssignedTo").profilePicUrl}
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
                  {
                    /* <CellRenderer
                    record={record}
                    field={globalConfig.get("selectedFieldId")}
                  /> */
                    record.getCellValue(globalConfig.get("selectedFieldId"))
                  }
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Box>
  );
}

initializeBlock(() => <SentimentDetectionBlock />);
