// src/components/pdf/AssignmentDocument.tsx
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

// Đăng ký Font hỗ trợ Tiếng Việt (Tải trực tiếp từ CDN)
Font.register({
  family: 'Roboto',
  fonts: [
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-light-webfont.ttf', fontWeight: 'normal' },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf', fontWeight: 'bold' }
  ]
});

// Cấu hình CSS nội bộ cho file PDF
const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Roboto', fontSize: 12 }, // Sử dụng Roboto thay vì Helvetica
  header: { flexDirection: 'row', justifyContent: 'space-between', borderBottom: '1 solid #000', paddingBottom: 10, marginBottom: 20 },
  companyName: { fontSize: 18, fontWeight: 'bold', color: '#1428A0' },
  docTitle: { fontSize: 16, textAlign: 'center', fontWeight: 'bold', marginBottom: 20, textTransform: 'uppercase' },
  section: { marginBottom: 15 },
  label: { fontSize: 10, color: '#666', marginBottom: 4 },
  value: { fontSize: 12, fontWeight: 'bold', marginBottom: 8 },
  table: { width: 'auto', borderStyle: 'solid', borderWidth: 1, borderColor: '#bfbfbf', marginBottom: 20 },
  tableRow: { flexDirection: 'row' },
  tableColHeader: { width: '25%', borderStyle: 'solid', borderBottomWidth: 1, borderRightWidth: 1, borderColor: '#bfbfbf', backgroundColor: '#f0f0f0', padding: 5 },
  tableCol: { width: '25%', borderStyle: 'solid', borderBottomWidth: 1, borderRightWidth: 1, borderColor: '#bfbfbf', padding: 5 },
  tableCell: { fontSize: 10 },
  remarkBox: { padding: 10, border: '1 dashed #bfbfbf', backgroundColor: '#f9f9f9', marginTop: 10 },
  signatureArea: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 50 },
  signatureBlock: { alignItems: 'center', width: '40%' },
  signatureLine: { width: '100%', borderBottom: '1 solid #000', marginTop: 40 },
});

interface AssignmentData {
  assetCode: string;
  assetName: string;
  serialNumber: string;
  assigneeName: string;
  department: string;
  date: string;
  remark?: string; // Bổ sung trường ghi chú
}

export const AssignmentDocument = ({ data }: { data: AssignmentData }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.companyName}>DAEHA CABLE VINA</Text>
          <Text style={{ fontSize: 10, color: '#666', marginTop: 4 }}>MES Asset Management System</Text>
        </View>
        <View>
          <Text style={{ fontSize: 10 }}>Form: FRM-IT-001</Text>
          <Text style={{ fontSize: 10 }}>Date: {data.date}</Text>
        </View>
      </View>

      <Text style={styles.docTitle}>ASSET HANDOVER PROTOCOL</Text>

      {/* Thông tin nhân viên */}
      <View style={styles.section}>
        <Text style={styles.label}>1. RECEIVER INFORMATION (THÔNG TIN NGƯỜI NHẬN)</Text>
        <View style={{ flexDirection: 'row', marginTop: 10 }}>
          <View style={{ width: '50%' }}>
            <Text style={styles.label}>Full Name:</Text>
            <Text style={styles.value}>{data.assigneeName}</Text>
          </View>
          <View style={{ width: '50%' }}>
            <Text style={styles.label}>Department:</Text>
            <Text style={styles.value}>{data.department}</Text>
          </View>
        </View>
      </View>

      {/* Thông tin thiết bị */}
      <View style={styles.section}>
        <Text style={styles.label}>2. ASSET DETAILS (THÔNG TIN THIẾT BỊ)</Text>
        <View style={styles.table}>
          <View style={styles.tableRow}>
            <View style={styles.tableColHeader}><Text style={styles.tableCell}>Asset Code</Text></View>
            <View style={{...styles.tableColHeader, width: '50%'}}><Text style={styles.tableCell}>Equipment Name</Text></View>
            <View style={styles.tableColHeader}><Text style={styles.tableCell}>Serial Number</Text></View>
          </View>
          <View style={styles.tableRow}>
            <View style={styles.tableCol}><Text style={styles.tableCell}>{data.assetCode}</Text></View>
            <View style={{...styles.tableCol, width: '50%'}}><Text style={styles.tableCell}>{data.assetName}</Text></View>
            <View style={styles.tableCol}><Text style={styles.tableCell}>{data.serialNumber}</Text></View>
          </View>
        </View>

        {/* Hiển thị Ghi chú tình trạng nếu có */}
        {data.remark && (
          <View style={styles.remarkBox}>
            <Text style={{ fontSize: 10, fontWeight: 'bold', marginBottom: 4 }}>Condition Remark (Tình trạng):</Text>
            <Text style={{ fontSize: 10, color: '#333' }}>{data.remark}</Text>
          </View>
        )}
      </View>

      {/* Điều khoản */}
      <View style={styles.section}>
        <Text style={{ fontSize: 10, lineHeight: 1.5, color: '#444' }}>
          By signing below, the receiver acknowledges receipt of the above equipment in good working condition. 
          The receiver is responsible for the proper care and security of the equipment.
        </Text>
      </View>

      {/* Chữ ký */}
      <View style={styles.signatureArea}>
        <View style={styles.signatureBlock}>
          <Text style={{ fontSize: 12, fontWeight: 'bold' }}>Handed over by</Text>
          <View style={styles.signatureLine}></View>
          <Text style={{ fontSize: 11, fontWeight: 'bold', marginTop: 5 }}>Lê Văn Đạt</Text>
          <Text style={{ fontSize: 9, color: '#666', marginTop: 2 }}>IT/ Quản trị viên MES</Text>
        </View>
        <View style={styles.signatureBlock}>
          <Text style={{ fontSize: 12, fontWeight: 'bold' }}>Received by</Text>
          <View style={styles.signatureLine}></View>
          <Text style={{ fontSize: 10, marginTop: 5 }}>Sign & Full Name</Text>
        </View>
      </View>
    </Page>
  </Document>
);