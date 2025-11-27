import ReactPDF, {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from '@react-pdf/renderer';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
    borderBottom: '2 solid #3b82f6',
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 5,
  },
  invoiceNumber: {
    fontSize: 14,
    color: '#6b7280',
  },
  section: {
    marginTop: 15,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#374151',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  label: {
    fontSize: 10,
    color: '#6b7280',
  },
  value: {
    fontSize: 10,
    color: '#111827',
  },
  table: {
    marginTop: 15,
    marginBottom: 15,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    padding: 8,
    borderBottom: '1 solid #d1d5db',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottom: '1 solid #e5e7eb',
  },
  tableCol: {
    flex: 1,
  },
  tableColWide: {
    flex: 2,
  },
  tableHeaderText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#374151',
  },
  tableText: {
    fontSize: 10,
    color: '#111827',
  },
  totalSection: {
    marginTop: 20,
    paddingTop: 10,
    borderTop: '2 solid #3b82f6',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 5,
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    marginRight: 20,
    color: '#374151',
  },
  totalValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e40af',
    minWidth: 100,
    textAlign: 'right',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    color: '#6b7280',
    fontSize: 9,
    borderTop: '1 solid #e5e7eb',
    paddingTop: 10,
  },
});

interface InvoiceData {
  invoice: {
    invoiceNumber: string;
    amount: number;
    status: string;
    createdAt: Date;
    dueDate?: Date | null;
  };
  booking: {
    startDate: Date;
    endDate: Date;
    totalPrice: number;
    deposit: number;
    notes?: string | null;
    item: {
      name: string;
      type: string;
      basePrice: number;
    };
  };
  customer: {
    name: string;
    email: string;
    phone: string;
    documentType: string;
    documentNumber: string;
    address?: string | null;
    city?: string | null;
    country?: string | null;
  };
  tenant: {
    name: string;
    location?: string | null;
    logo?: string | null;
  };
}

// Invoice PDF Document
const InvoiceDocument = ({ data }: { data: InvoiceData }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>FACTURA</Text>
        <Text style={styles.invoiceNumber}>{data.invoice.invoiceNumber}</Text>
      </View>

      {/* Company Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{data.tenant.name}</Text>
        {data.tenant.location && (
          <Text style={styles.value}>{data.tenant.location}</Text>
        )}
      </View>

      {/* Customer Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Cliente</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Nombre:</Text>
          <Text style={styles.value}>{data.customer.name}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Email:</Text>
          <Text style={styles.value}>{data.customer.email}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Teléfono:</Text>
          <Text style={styles.value}>{data.customer.phone}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Documento:</Text>
          <Text style={styles.value}>
            {data.customer.documentType} {data.customer.documentNumber}
          </Text>
        </View>
        {data.customer.address && (
          <View style={styles.row}>
            <Text style={styles.label}>Dirección:</Text>
            <Text style={styles.value}>
              {data.customer.address}
              {data.customer.city && `, ${data.customer.city}`}
              {data.customer.country && `, ${data.customer.country}`}
            </Text>
          </View>
        )}
      </View>

      {/* Invoice Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Detalles de la Factura</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Fecha de emisión:</Text>
          <Text style={styles.value}>
            {format(new Date(data.invoice.createdAt), 'PPP', { locale: es })}
          </Text>
        </View>
        {data.invoice.dueDate && (
          <View style={styles.row}>
            <Text style={styles.label}>Fecha de vencimiento:</Text>
            <Text style={styles.value}>
              {format(new Date(data.invoice.dueDate), 'PPP', { locale: es })}
            </Text>
          </View>
        )}
        <View style={styles.row}>
          <Text style={styles.label}>Estado:</Text>
          <Text style={styles.value}>{data.invoice.status}</Text>
        </View>
      </View>

      {/* Booking Details Table */}
      <View style={styles.table}>
        <Text style={styles.sectionTitle}>Detalle de la Reserva</Text>
        <View style={styles.tableHeader}>
          <View style={styles.tableColWide}>
            <Text style={styles.tableHeaderText}>Concepto</Text>
          </View>
          <View style={styles.tableCol}>
            <Text style={styles.tableHeaderText}>Desde</Text>
          </View>
          <View style={styles.tableCol}>
            <Text style={styles.tableHeaderText}>Hasta</Text>
          </View>
          <View style={styles.tableCol}>
            <Text style={[styles.tableHeaderText, { textAlign: 'right' }]}>
              Importe
            </Text>
          </View>
        </View>
        <View style={styles.tableRow}>
          <View style={styles.tableColWide}>
            <Text style={styles.tableText}>
              Alquiler de {data.booking.item.name}
            </Text>
            <Text style={[styles.tableText, { fontSize: 8, color: '#6b7280' }]}>
              Tipo: {data.booking.item.type}
            </Text>
          </View>
          <View style={styles.tableCol}>
            <Text style={styles.tableText}>
              {format(new Date(data.booking.startDate), 'dd/MM/yyyy')}
            </Text>
          </View>
          <View style={styles.tableCol}>
            <Text style={styles.tableText}>
              {format(new Date(data.booking.endDate), 'dd/MM/yyyy')}
            </Text>
          </View>
          <View style={styles.tableCol}>
            <Text style={[styles.tableText, { textAlign: 'right' }]}>
              €{data.booking.totalPrice.toFixed(2)}
            </Text>
          </View>
        </View>
        {data.booking.deposit > 0 && (
          <View style={styles.tableRow}>
            <View style={styles.tableColWide}>
              <Text style={styles.tableText}>Depósito</Text>
            </View>
            <View style={styles.tableCol} />
            <View style={styles.tableCol} />
            <View style={styles.tableCol}>
              <Text style={[styles.tableText, { textAlign: 'right' }]}>
                €{data.booking.deposit.toFixed(2)}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Notes */}
      {data.booking.notes && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Observaciones</Text>
          <Text style={styles.value}>{data.booking.notes}</Text>
        </View>
      )}

      {/* Total */}
      <View style={styles.totalSection}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>TOTAL:</Text>
          <Text style={styles.totalValue}>
            €{data.invoice.amount.toFixed(2)}
          </Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text>Gracias por su confianza</Text>
        <Text>{data.tenant.name}</Text>
      </View>
    </Page>
  </Document>
);

// Generate PDF and return buffer
export async function generateInvoicePDF(data: InvoiceData): Promise<Buffer> {
  const doc = <InvoiceDocument data={data} />;
  const pdfBuffer = await ReactPDF.renderToBuffer(doc);
  return pdfBuffer;
}
