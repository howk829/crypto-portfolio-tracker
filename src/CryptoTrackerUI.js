import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  Container,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Grid,
  Select,
  MenuItem,
  FormControl,
  Box,
  ToggleButtonGroup,
  ToggleButton,
} from "@mui/material";
import { useMediaQuery } from "@mui/material";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// 1) Import crosshair plugin
import CrosshairPlugin from "chartjs-plugin-crosshair";

ChartJS.register(
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
  // 2) Register crosshair plugin
  CrosshairPlugin
);

const icons = {
  BTC: "https://cryptologos.cc/logos/bitcoin-btc-logo.png",
  ETH: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
  XRP: "https://cryptologos.cc/logos/xrp-xrp-logo.png",
  SOL: "https://cryptologos.cc/logos/solana-sol-logo.png",
};

const CryptoTrackerUI = () => {
  const [portfolio, setPortfolio] = useState([
    { asset: "BTC", price: 40000, quantity: 1 },
    { asset: "ETH", price: 2500, quantity: 5 },
  ]);
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [
      {
        label: "Price (USD)",
        data: [],
        borderColor: "#3f51b5",
        backgroundColor: "rgba(63, 81, 181, 0.3)",
        fill: true,
        tension: 0.3,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: "#3f51b5",
      },
    ],
  });
  const [hoveredData, setHoveredData] = useState([]);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [timeRange, setTimeRange] = useState("24h");
  const chartRef = useRef(null);

  const isMobile = useMediaQuery("(max-width:768px)");
  const chartHeight = isMobile ? 300 : 500;

  const getTotalPortfolioValue = () => {
    return portfolio.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  };

  const fetchHistoricalData = async (asset, range) => {
    const rangeMapping = {
      "24h": { interval: "1h", limit: 48 },
      "7d": { interval: "1h", limit: 168 },
      "1M": { interval: "4h", limit: 180 },
      "1Y": { interval: "1d", limit: 365 },
      ALL: { interval: "1w", limit: 500 },
    };

    try {
      const { interval, limit } = rangeMapping[range];
      const response = await axios.get(
        `https://api.binance.com/api/v3/klines`,
        {
          params: {
            symbol: `${asset}USDT`,
            interval,
            limit,
          },
        }
      );

      const prices = response.data.map((item) => ({
        time: item[0],
        price: parseFloat(item[4]),
      }));

      // Generate readable labels with evenly spaced steps
      const step = Math.max(1, Math.floor(prices.length / 10)); // Adjust for 10 labels max

      const labels = prices.map((item, index) => {
        const date = new Date(item.time);
        if (index % step === 0 || index === prices.length - 1) {
          return range === "24h"
            ? `${date.getUTCHours()}:00`
            : `${date.getDate()} ${date.toLocaleString("default", { month: "short" })} ${range === "ALL" || range === "1Y" ? date.getFullYear() : ""}`;
        }
        return "";
      });

      const data = prices.map((item) => item.price);

      setHoveredData(prices);

      return { labels, data };
    } catch (error) {
      console.error("Error fetching data:", error);
      return { labels: [], data: [] };
    }
  };

  const handleAssetClick = async (asset) => {
    setSelectedAsset(asset);
    const { labels, data } = await fetchHistoricalData(asset, timeRange);
    setChartData({
      labels,
      datasets: [
        {
          label: `${asset} Price (USD)`,
          data,
          borderColor: "#3f51b5",
          backgroundColor: "rgba(63, 81, 181, 0.3)",
          fill: true,
          tension: 0.3,
          pointRadius: 0,
          pointHoverRadius: 6,
          pointHoverBackgroundColor: "#3f51b5",
        },
      ],
    });
  };

  const handleTimeRangeChange = async (event, newRange) => {
    setTimeRange(newRange);
    if (selectedAsset) {
      const { labels, data } = await fetchHistoricalData(selectedAsset, newRange);
      setChartData({
        labels,
        datasets: [
          {
            label: `${selectedAsset} Price (USD)`,
            data,
            borderColor: "#3f51b5",
            backgroundColor: "rgba(63, 81, 181, 0.3)",
            fill: true,
            tension: 0.3,
            pointRadius: 0,
            pointHoverRadius: 6,
            pointHoverBackgroundColor: "#3f51b5",
          },
        ],
      });
    }
  };

  return (
    <Container maxWidth="lg" style={{ marginTop: "2rem" }}>
      <Typography variant="h4" align="center" gutterBottom>
        Crypto Tracker
      </Typography>

      <Grid container spacing={4}>
        <Grid item xs={12} md={4}>
          <Card style={{ marginBottom: "2rem", padding: "1rem" }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Total Portfolio Value
              </Typography>
              <Typography variant="h4" color="primary">
                ${getTotalPortfolioValue().toFixed(2)}
              </Typography>
            </CardContent>
          </Card>

          <Card style={{ marginBottom: "2rem" }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Portfolio
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Asset</TableCell>
                      <TableCell>Price (USD)</TableCell>
                      <TableCell>Quantity</TableCell>
                      <TableCell>Value (USD)</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {portfolio.map((item) => (
                      <TableRow
                        key={item.asset}
                        onClick={() => handleAssetClick(item.asset)}
                        style={{
                          cursor: "pointer",
                          backgroundColor:
                            selectedAsset === item.asset ? "#f0f0f0" : "inherit",
                        }}
                      >
                        <TableCell>
                          <img
                            src={icons[item.asset]}
                            alt={item.asset}
                            style={{ height: 24, marginRight: 8 }}
                          />
                          {item.asset}
                        </TableCell>
                        <TableCell>${item.price.toFixed(2)}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>
                          ${(item.price * item.quantity).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>

          <Card style={{ marginBottom: "2rem" }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Add New Asset
              </Typography>
              <Box component="form" style={{ display: "grid", gap: "1rem" }}>
                <FormControl fullWidth>
                  <Select
                    value={selectedAsset}
                    onChange={(e) => setSelectedAsset(e.target.value)}
                  >
                    {Object.entries(icons).map(([key, url]) => (
                      <MenuItem key={key} value={key}>
                        <img
                          src={url}
                          alt={key}
                          style={{ height: 24, marginRight: 8 }}
                        />
                        {key}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  label="Quantity"
                  variant="outlined"
                  type="number"
                  fullWidth
                />
                <TextField
                  label="Cost (USD)"
                  variant="outlined"
                  type="number"
                  fullWidth
                />
                <Button variant="contained" color="primary" fullWidth>
                  Add
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card style={{ padding: "1rem" }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {selectedAsset ? `${selectedAsset} Price Chart` : "Total Portfolio Value Chart"}
              </Typography>
              <ToggleButtonGroup
                value={timeRange}
                exclusive
                onChange={handleTimeRangeChange}
                style={{ marginBottom: "1rem" }}
              >
                <ToggleButton value="24h">24h</ToggleButton>
                <ToggleButton value="7d">7d</ToggleButton>
                <ToggleButton value="1M">1M</ToggleButton>
                <ToggleButton value="1Y">1Y</ToggleButton>
                <ToggleButton value="ALL">ALL</ToggleButton>
              </ToggleButtonGroup>
              <div style={{ height: `${chartHeight}px` }}>
                <Line
                  ref={chartRef}
                  data={chartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    // 3) Use crosshair plugin
                    plugins: {
                      crosshair: {
                        line: {
                          color: "black", // black vertical line
                          width: 1,
                        },
                        sync: {
                          enabled: false, // no syncing with other charts
                        },
                      },
                      legend: {
                        position: "top",
                      },
                      title: {
                        display: true,
                        text: selectedAsset
                          ? `${selectedAsset} Price History (${timeRange})`
                          : `Price History (${timeRange})`,
                      },
                      tooltip: {
                        enabled: true,
                        mode: "index",
                        intersect: false,
                        callbacks: {
                          label: (tooltipItem) => {
                            const hoveredItem = hoveredData[tooltipItem.dataIndex];
                            const date = new Date(hoveredItem.time);
                            return [
                                `Price: $${tooltipItem.raw.toFixed(2)}`,
                                `Time: ${date.toLocaleString()}`
                              ];
                          },
                        },
                      },
                    },
                    interaction: {
                      mode: "index",
                      intersect: false,
                    },
                    hover: {
                      mode: "index",
                      intersect: false,
                    },
                    scales: {
                      x: {
                        title: {
                          display: true,
                          text: timeRange === "24h" ? "Time (Hourly)" : "Date",
                        },
                        ticks: {
                          autoSkip: isMobile,
                          font: {
                            size: isMobile ? 10 : 12,
                          },
                        },
                        grid: {
                          display: false,
                        },
                      },
                      y: {
                        title: {
                          display: true,
                          text: "Price (USD)",
                        },
                        ticks: {
                          font: {
                            size: isMobile ? 10 : 12,
                          },
                        },
                        grid: {
                          display: false,
                        },
                      },
                    },
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default CryptoTrackerUI;
