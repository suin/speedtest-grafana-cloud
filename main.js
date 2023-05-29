import fetch from "node-fetch";
import assert from "node:assert";
import { exec } from "node:child_process";
import util from "node:util";
import * as dotenv from "dotenv";

const execAsync = util.promisify(exec);

dotenv.config();
const USER_ID = process.env["USER_ID"]; // e.g. "1234"
const API_KEY = process.env["API_KEY"];
const GRAFANA_CLOUD_URL = process.env["GRAFANA_CLOUD_URL"]; // e.g. "https://us-central1-1.grafana.net"

assert(typeof USER_ID === "string", "USER_ID is required");
assert(typeof API_KEY === "string", "API_KEY is required");
assert(typeof GRAFANA_CLOUD_URL === "string", "GRAFANA_CLOUD_URL is required");

async function fetchNetworkSpeedData() {
  console.log("Running speedtest");
  const { stdout } = await execAsync(`speedtest -f json --accept-license`);
  console.log(stdout);
  return JSON.parse(stdout);
}

async function getWifiSSID() {
  const { stdout } = await execAsync(`./print_ssid_macos.sh`);
  return stdout.trim();
}
async function getNetworkDevice() {
  const { stdout } = await execAsync(`./print_default_network_device.sh`);
  return stdout.trim();
}
async function getHostname() {
  const { stdout } = await execAsync(`hostname`);
  return stdout.trim();
}
async function submitNetworkMetrics(hostname, ssid, device) {
  const speedData = await fetchNetworkSpeedData();
  const { download, upload, ping, timestamp, server } = speedData;
  const downloadMbps = Math.round(download.bandwidth / 125000);
  const uploadMbps = Math.round(upload.bandwidth / 125000);
  const host = server.host;
  const body = `speedtest,source=${hostname},host=${host},ssid=${ssid},device=${device} download=${downloadMbps},upload=${uploadMbps},ping=${
    ping.latency
  } ${Date.parse(timestamp) * 1000000}`;
  console.log(body);
  const response = await fetch(
    `${GRAFANA_CLOUD_URL}/api/v1/push/influx/write`,
    {
      method: "post",
      body,
      headers: {
        Authorization: `Bearer ${USER_ID}:${API_KEY}`,
        "Content-Type": "text/plain",
      },
    }
  );
  console.log(response.status, await response.text());
}

async function main() {
  try {
    await submitNetworkMetrics(
      await getHostname(),
      await getWifiSSID(),
      await getNetworkDevice()
    );
  } catch (error) {
    console.error(error);
  }
}

await main();
setInterval(async () => {
  await main();
}, 1000 * 60 * 3);
