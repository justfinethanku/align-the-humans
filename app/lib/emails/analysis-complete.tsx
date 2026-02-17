/**
 * Analysis Complete Email
 *
 * Sent to both participants when AI analysis is finished.
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

interface AnalysisCompleteEmailProps {
  recipientName: string;
  alignmentTitle: string;
  alignmentScore: number;
  conflictCount: number;
  agreementCount: number;
  alignmentUrl: string;
  appUrl: string;
}

export function AnalysisCompleteEmail({
  recipientName = 'there',
  alignmentTitle = 'your alignment',
  alignmentScore = 0,
  conflictCount = 0,
  agreementCount = 0,
  alignmentUrl = '#',
  appUrl = 'https://alignthehumans.com',
}: AnalysisCompleteEmailProps) {
  const scoreColor =
    alignmentScore >= 70
      ? colors.success
      : alignmentScore >= 40
        ? colors.warning
        : colors.danger;

  return (
    <Html>
      <Head />
      <Body style={baseStyles.body}>
        <Container style={baseStyles.container}>
          <Text style={baseStyles.heading}>
            Your analysis is ready
          </Text>
          <Text style={baseStyles.text}>
            Hi {recipientName}, the AI has analyzed responses for{' '}
            <strong style={{ color: colors.text }}>{alignmentTitle}</strong>.
          </Text>

          {/* Score summary */}
          <Section
            style={{
              backgroundColor: colors.background,
              borderRadius: '8px',
              padding: '20px',
              margin: '24px 0',
              textAlign: 'center',
            }}
          >
            <Text
              style={{
                color: scoreColor,
                fontSize: '36px',
                fontWeight: '700',
                margin: '0 0 4px 0',
              }}
            >
              {alignmentScore}%
            </Text>
            <Text
              style={{
                color: colors.textMuted,
                fontSize: '13px',
                margin: '0 0 16px 0',
              }}
            >
              Alignment Score
            </Text>
            <Text
              style={{
                color: colors.textMuted,
                fontSize: '14px',
                margin: '0',
              }}
            >
              {agreementCount} agreement{agreementCount !== 1 ? 's' : ''} ·{' '}
              {conflictCount} conflict{conflictCount !== 1 ? 's' : ''} to resolve
            </Text>
          </Section>

          <Section style={{ textAlign: 'center', margin: '32px 0' }}>
            <Button style={baseStyles.button} href={alignmentUrl}>
              Review Results
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

export default AnalysisCompleteEmail;
