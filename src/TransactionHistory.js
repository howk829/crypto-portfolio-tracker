import React from "react";
import {
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";

const mockData = [
  {
    asset: "BTC",
    price: 43000,
    change1h: 0.5,
    change24h: 2.3,
    change7d: 5.6,
    quantity: 1.2,
    avgBuyPrice: 42000,
  },
  {
    asset: "ETH",
    price: 3000,
    change1h: -0.2,
    change24h: 1.8,
    change7d: 4.2,
    quantity: 3,
    avgBuyPrice: 2800,
  },
  {
    asset: "SOL",
    price: 100,
    change1h: 0.1,
    change24h: -0.8,
    change7d: 2.5,
    quantity: 10,
    avgBuyPrice: 95,
  },
];

const icons = {
  BTC: "https://cryptologos.cc/logos/bitcoin-btc-logo.png",
  ETH: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
  SOL: "https://cryptologos.cc/logos/solana-sol-logo.png",
};

const TransactionHistory = () => {
  return (
    <Card style={{ marginTop: "2rem" }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Transaction History
        </Typography>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Asset</TableCell>
                <TableCell>Price (USD)</TableCell>
                <TableCell>1h%</TableCell>
                <TableCell>24h%</TableCell>
                <TableCell>7d%</TableCell>
                <TableCell>Holdings</TableCell>
                <TableCell>Avg. Buy Price</TableCell>
                <TableCell>Profit/Loss (USD)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {mockData.map((item) => {
                const profitLoss =
                  item.price * item.quantity - item.avgBuyPrice * item.quantity;

                return (
                  <TableRow key={item.asset}>
                    <TableCell>
                      <img
                        src={icons[item.asset]}
                        alt={item.asset}
                        style={{ height: 24, marginRight: 8 }}
                      />
                      {item.asset}
                    </TableCell>
                    <TableCell>${item.price.toFixed(2)}</TableCell>
                    <TableCell
                      style={{
                        color: item.change1h >= 0 ? "green" : "red",
                      }}
                    >
                      {item.change1h.toFixed(2)}%
                    </TableCell>
                    <TableCell
                      style={{
                        color: item.change24h >= 0 ? "green" : "red",
                      }}
                    >
                      {item.change24h.toFixed(2)}%
                    </TableCell>
                    <TableCell
                      style={{
                        color: item.change7d >= 0 ? "green" : "red",
                      }}
                    >
                      {item.change7d.toFixed(2)}%
                    </TableCell>
                    <TableCell>{item.quantity.toFixed(4)}</TableCell>
                    <TableCell>${item.avgBuyPrice.toFixed(2)}</TableCell>
                    <TableCell
                      style={{
                        color: profitLoss >= 0 ? "green" : "red",
                      }}
                    >
                      ${profitLoss.toFixed(2)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};

export default TransactionHistory;