/**
 * Alignment Ready for Analysis Email
 *
 * Sent when both partners have submitted their responses.
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

interface AlignmentReadyEmailProps {
  recipientName: string;
  partnerName: string;
  alignmentTitle: string;
  alignmentUrl: string;
  appUrl: string;
}

export function AlignmentReadyEmail({
  recipientName = 'there',
  partnerName = 'Your partner',
  alignmentTitle = 'your alignment',
  alignmentUrl = '#',
  appUrl = 'https://alignthehumans.com',
}: AlignmentReadyEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={baseStyles.body}>
        <Container style={baseStyles.container}>
          <Text style={baseStyles.heading}>
            Both responses are in
          </Text>
          <Text style={baseStyles.text}>
            Hi {recipientName},{' '}
            <strong style={{ color: colors.text }}>{partnerName}</strong> has
            submitted their responses to{' '}
            <strong style={{ color: colors.text }}>{alignmentTitle}</strong>.
          </Text>
          <Text style={baseStyles.text}>
            You&apos;re ready to run AI analysis and see where you align and where
            you differ.
          </Text>
          <Section style={{ textAlign: 'center', margin: '32px 0' }}>
            <Button style={baseStyles.button} href={alignmentUrl}>
              View Analysis
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

export default AlignmentReadyEmail;
