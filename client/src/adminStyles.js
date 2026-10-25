

export const cell = {
  padding: "10px 12px",
  borderBottom: "1px solid #2a2f4a",
  textAlign: "left",
};

export const smallButton = (color) => ({
  padding: "4px 12px",
  borderRadius: 6,
  border: `1px solid ${color}`,
  background: "transparent",
  color,
  marginRight: 6,
});

export const fieldStyle = {
  padding: 10,
  borderRadius: 6,
  border: "1px solid #2a2f4a",
  background: "#171b30",
  color: "#f1f1f1",
};

export const STATUS_COLOR = {
  confirmed: "#4cd964",
  pending: "#c98a1b",
  cancelled: "#999",
  failed: "#ff4d6d",
  paid: "#4cd964",
  created: "#c98a1b",
  refund_needed: "#ff4d6d",
  refunded: "#4cd964",
  none: "#777",
};