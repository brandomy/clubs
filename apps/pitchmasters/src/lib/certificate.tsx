/**
 * Certificate PDF Generator
 *
 * Generates a branded completion certificate using @react-pdf/renderer.
 * Runs entirely in the browser (client-side). Returns a Blob URL for download.
 * No Supabase Storage required for MVP.
 */
/* eslint-disable react-refresh/only-export-components */

import { pdf, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#ffffff',
    padding: 60,
    fontFamily: 'Helvetica',
  },
  border: {
    border: '4px solid #072B61',
    padding: 40,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  clubName: {
    fontSize: 12,
    color: '#E31F26',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  certificateTitle: {
    fontSize: 28,
    color: '#072B61',
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    marginBottom: 6,
  },
  certSubtitle: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
  body: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    gap: 12,
  },
  presentsTo: {
    fontSize: 12,
    color: '#888888',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  memberName: {
    fontSize: 32,
    color: '#072B61',
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    borderBottom: '1px solid #072B61',
    paddingBottom: 8,
    marginBottom: 8,
  },
  completedText: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
  },
  pathTitle: {
    fontSize: 20,
    color: '#E31F26',
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
  },
  footer: {
    alignItems: 'center',
    gap: 4,
  },
  date: {
    fontSize: 11,
    color: '#888888',
  },
  disclaimer: {
    fontSize: 9,
    color: '#aaaaaa',
    textAlign: 'center',
    marginTop: 8,
  },
});

interface CertificateData {
  memberName: string;
  pathTitle: string;
  completedDate: string;
  clubName: string;
}

function CertificateDocument({ memberName, pathTitle, completedDate, clubName }: CertificateData) {
  return (
    <Document title={`${memberName} — ${pathTitle} Certificate`}>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.border}>
          <View style={styles.header}>
            <Text style={styles.clubName}>{clubName}</Text>
            <Text style={styles.certificateTitle}>Certificate of Completion</Text>
            <Text style={styles.certSubtitle}>
              Toastmasters Learning Management System
            </Text>
          </View>

          <View style={styles.body}>
            <Text style={styles.presentsTo}>This certifies that</Text>
            <Text style={styles.memberName}>{memberName}</Text>
            <Text style={styles.completedText}>
              has successfully completed the learning path
            </Text>
            <Text style={styles.pathTitle}>{pathTitle}</Text>
          </View>

          <View style={styles.footer}>
            <Text style={styles.date}>
              Completed on {completedDate}
            </Text>
            <Text style={styles.disclaimer}>
              This certificate was issued by {clubName} and is not endorsed by
              Toastmasters International.
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}

/**
 * Generate a certificate PDF and return a Blob URL for download.
 * The caller is responsible for revoking the URL when done:
 *   URL.revokeObjectURL(blobUrl)
 */
export async function generateCertificate(data: CertificateData): Promise<string> {
  const doc = <CertificateDocument {...data} />;
  const blob = await pdf(doc).toBlob();
  return URL.createObjectURL(blob);
}

/**
 * Trigger a browser download of the certificate PDF.
 */
export async function downloadCertificate(data: CertificateData): Promise<void> {
  const url = await generateCertificate(data);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${data.memberName.replace(/\s+/g, '-')}-${data.pathTitle.replace(/\s+/g, '-')}-Certificate.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
