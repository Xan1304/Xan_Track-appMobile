const NAVY = '#1a3a6b';

export const getInvoiceHTML = (data: {
  storeName: string;
  salesmanName: string;
  orderItems: any[];
  totalAmount: number;
}) => {
  return `
    <html>
      <body style="font-family: Arial; padding: 40px; color: #0f172a;">
        <div style="text-align:center; margin-bottom:24px;">
          <h1 style="color:${NAVY}; margin:0; font-size:22px;">CÔNG TY SỮA XAN</h1>
          <h2 style="margin:4px 0 0; font-size:16px; color:#475569;">BIÊN BẢN ĐƠN HÀNG</h2>
        </div>
        <hr style="border-color:#e2e8f0;"/>
        <table style="width:100%; font-size:13px; margin:16px 0;">
          <tr><td style="color:#64748b; padding:4px 0;">Cửa hàng</td><td style="font-weight:600;">${data.storeName}</td></tr>
          <tr><td style="color:#64748b; padding:4px 0;">Nhân viên</td><td style="font-weight:600;">${data.salesmanName}</td></tr>
          <tr><td style="color:#64748b; padding:4px 0;">Ngày</td><td style="font-weight:600;">${new Date().toLocaleDateString('vi-VN')}</td></tr>
        </table>
        <table style="width:100%; border-collapse:collapse; margin-top:16px; font-size:13px;">
          <tr style="background:#f8fafc;">
            <th style="border:1px solid #e2e8f0; padding:10px; text-align:left;">Sản phẩm</th>
            <th style="border:1px solid #e2e8f0; padding:10px; text-align:center; width:60px;">SL</th>
            <th style="border:1px solid #e2e8f0; padding:10px; text-align:right; width:100px;">Thành tiền</th>
          </tr>
          ${data.orderItems.map(item => `
            <tr>
              <td style="border:1px solid #e2e8f0; padding:10px;">${item.ten_san_pham}</td>
              <td style="border:1px solid #e2e8f0; padding:10px; text-align:center;">${item.quantity}</td>
              <td style="border:1px solid #e2e8f0; padding:10px; text-align:right;">${item.total.toLocaleString()}đ</td>
            </tr>
          `).join('')}
          <tr style="background:#f8fafc;">
            <td colspan="2" style="text-align:right; padding:12px; font-weight:700;">TỔNG CỘNG</td>
            <td style="text-align:right; padding:12px; color:${NAVY}; font-weight:700; font-size:15px;">${Number(data.totalAmount).toLocaleString()}đ</td>
          </tr>
        </table>
        <div style="margin-top:60px; display:flex; justify-content:space-between;">
          <div style="text-align:center; width:45%;">
            <p style="font-weight:600; color:#0f172a;">Chủ cửa hàng</p>
            <div style="height:60px;"></div>
            <p style="color:#64748b; font-size:12px;">(Ký và ghi rõ họ tên)</p>
          </div>
          <div style="text-align:center; width:45%;">
            <p style="font-weight:600; color:#0f172a;">Nhân viên kinh doanh</p>
            <div style="height:60px;"></div>
            <p style="color:#475569; font-size:12px;">${data.salesmanName}</p>
          </div>
        </div>
      </body>
    </html>
  `;
};
