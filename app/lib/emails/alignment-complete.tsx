/**
 * Alignment Complete Email
 *
 * Sent when both parties have signed the final agreement.
 */

import * as React from 'react';
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Button,
  Hr,
  Link,
} from '@react-email/components';
import { baseStyles, colors } from './styles';

interface AlignmentCompleteEmailProps {
  recipientName: string;
  partnerName: string;
  alignmentTitle: string;
  documentUrl: string;
  appUrl: string;
}

export function AlignmentCompleteEmail({
  recipientName = 'there',
  partnerName = 'Your partner',
  alignmentTitle = 'your alignment',
  documentUrl = '#',
  appUrl = 'https://alignthehumans.com',
}: AlignmentCompleteEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={baseStyles.body}>
        <Container style={baseStyles.container}>
          <Text style={baseStyles.heading}>
            Alignment complete
          </Text>
          <Text style={baseStyles.text}>
            Hi {recipientName}, both you and{' '}
            <strong style={{ color: colors.text }}>{partnerName}</strong> have
            signed the agreement for{' '}
            <strong style={{ color: colors.text }}>{alignmentTitle}</strong>.
          </Text>
          <Text style={baseStyles.text}>
            Your signed document is ready to view and download.
          </Text>
          <Section style={{ textAlign: 'center', margin: '32px 0' }}>
            <Button style={baseStyles.button} href={documentUrl}>
              View Agreement
            </Button>
          </Section>
          <Hr style={baseStyles.divider} />
          <Text style={baseStyles.footer}>
            <Link href={appUrl} style={baseStyles.link}>
              Human Alignment
            </Link>{' '}
            — Structure for every decision that matters.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default AlignmentCompleteEmail;
