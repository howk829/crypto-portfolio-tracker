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
  Switch,
  FormControlLabel,
} from "@mui/material";
import { useMediaQuery, createTheme, ThemeProvider } from "@mui/material";
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
import TransactionHistory from "./TransactionHistory";

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

  const [transactionHistory, setTransactionHistory] = useState([]);
  const [liveData, setLiveData] = useState({});

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
  const [currentPrice, setCurrentPrice] = useState(""); // Added for current price
  const [timeRange, setTimeRange] = useState("24h");
  const [transactionType, setTransactionType] = useState("buy"); // Added for toggling buy/sell
  const [darkMode, setDarkMode] = useState(true); // Added for light/dark mode toggle
  const chartRef = useRef(null);

  const isMobile = useMediaQuery("(max-width:768px)");
  const chartHeight = isMobile ? 300 : 500;

  const theme = createTheme({
    palette: {
      mode: darkMode ? "dark" : "light",
    },
  });

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

  const fetchCurrentPrice = async (asset) => {
    try {
      const response = await axios.get(
        `https://api.binance.com/api/v3/ticker/price`,
        {
          params: { symbol: `${asset}USDT` },
        }
      );
      setCurrentPrice(parseFloat(response.data.price).toFixed(2)); // Set current price
    } catch (error) {
      console.error("Error fetching current price:", error);
      setCurrentPrice("");
    }
  };

  const handleAssetClick = async (asset) => {
    setSelectedAsset(asset);
    const { labels, data } = await fetchHistoricalData(asset, timeRange);
    await fetchCurrentPrice(asset);

    setChartData({
      labels,
      datasets: [
        {
          label: `${asset} Price (USD)`
          ,
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
            label: `${selectedAsset} Price (USD)`
            ,
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

  const handleAssetSelection = (asset) => {
    setSelectedAsset(asset);
    if (asset) fetchCurrentPrice(asset); // Fetch and set the current price
  };

  const handleTransactionTypeChange = (event, newType) => {
    if (newType !== null) {
      setTransactionType(newType);
    }
  };

  const handleDarkModeToggle = (event) => {
    setDarkMode(event.target.checked);
  };

  const handleAddTransaction = () => {
    if (!selectedAsset || !currentPrice) {
      alert("Please select an asset and ensure the price is loaded.");
      return;
    }
    const quantityInput = document.querySelector("input[label='Quantity']");
    const quantity = parseFloat(quantityInput?.value || 0);

    if (quantity <= 0) {
      alert("Please enter a valid quantity.");
      return;
    }

    const transaction = {
      asset: selectedAsset,
      type: transactionType,
      price: parseFloat(currentPrice),
      quantity: transactionType === "buy" ? quantity : -quantity,
      avgBuyPrice:
        transactionType === "buy"
          ? currentPrice
          : transactionHistory.find((item) => item.asset === selectedAsset)
              ?.avgBuyPrice || 0,
    };

    setTransactionHistory((prev) => {
      const existing = prev.find((item) => item.asset === transaction.asset);

      if (existing) {
        const totalQuantity =
          existing.quantity + transaction.quantity;
        const newAvgBuyPrice =
          transactionType === "buy"
            ? (existing.avgBuyPrice * existing.quantity +
                transaction.price * transaction.quantity) /
              totalQuantity
            : existing.avgBuyPrice;

        return prev.map((item) =>
          item.asset === transaction.asset
            ? {
                ...item,
                quantity: totalQuantity,
                avgBuyPrice: newAvgBuyPrice,
              }
            : item
        );
      } else {
        return [...prev, transaction];
      }
    });

    quantityInput.value = "";
  };

  return (
    <ThemeProvider theme={theme}>
      <Container      maxWidth={false} // Fill the entire screen
      style={{
        backgroundColor: darkMode ? "#001e3c" : "#ffffff", // Dark blue for dark mode, white for light mode
        color: darkMode ? "#ffffff" : "#000000", // White text for dark mode, black for light mode
        minHeight: "100vh", // Ensure the container fills the entire viewport height
        transition: "background-color 0.3s ease, color 0.3s ease", // Smooth transition
    }}>
        <Box>
            <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                sx={{
                backgroundColor: darkMode ? "#001e3c" : "#ffffff",
                color: darkMode ? "#ffffff" : "#000000",
                padding: "1rem 2rem",
                }}
            >
                <Typography variant="h4" sx={{ fontWeight: "bold" }}>
                Crypto Tracker
                </Typography>
                <FormControlLabel
                control={
                    <Switch
                    checked={darkMode}
                    onChange={handleDarkModeToggle}
                    color="primary"
                    />
                }
                label={darkMode ? "Dark Mode" : "Light Mode"}
                />
            </Box>
            <Box
                sx={{
                height: "2px",
                backgroundColor: darkMode ? "#3f51b5" : "#cccccc",
                marginBottom: "2rem",
                }}
            />
        </Box>

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
                            selectedAsset === item.asset
                                ? darkMode
                                ? "#3f51b5" // Blue for dark mode
                                : "#f0f0f0" // Light gray for light mode
                                : "inherit",
                            color: selectedAsset === item.asset && darkMode ? "#fff" : "inherit",
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
                  Add Transaction
                </Typography>
                <Box component="form" style={{ display: "grid", gap: "1rem" }}>
                  <ToggleButtonGroup
                    value={transactionType}
                    exclusive
                    onChange={handleTransactionTypeChange}
                    style={{ marginBottom: "1rem" }}
                  >
                    <ToggleButton value="buy">Buy</ToggleButton>
                    <ToggleButton value="sell">Sell</ToggleButton>
                  </ToggleButtonGroup>
                  <FormControl fullWidth>
                    <Select
                      value={selectedAsset || ""}
                      onChange={(e) => handleAssetSelection(e.target.value)}
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
                    InputProps={{ inputProps: { min: 0 } }}
                    fullWidth
                  />
                  <TextField
                    label="Cost (USD)"
                    variant="outlined"
                    type="number"
                    fullWidth
                    value={currentPrice} // Pre-fill the cost input with the current price
                    InputProps={{
                      readOnly: true, // Make it read-only to prevent manual changes
                    }}
                  />
                  <Button   
                    onClick={handleAddTransaction} 
                    variant="contained" 
                    color="primary" 
                    fullWidth
                  >
                    {transactionType === "buy" ? "Buy" : "Sell"}
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
                            color: "grey", // grey vertical line
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
                              return `Price: $${tooltipItem.raw.toFixed(2)} | Time: ${date.toLocaleString()}`;
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

        <TransactionHistory
          transactionHistory={transactionHistory}
          liveData={liveData}
          icons={icons}
        />

      </Container>
    </ThemeProvider>
  );
};

export default CryptoTrackerUI;