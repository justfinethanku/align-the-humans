/**
 * Partner Invite Email Template
 *
 * Sent when a user shares an alignment invite link.
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

interface InvitePartnerEmailProps {
  inviterName: string;
  alignmentTitle: string;
  inviteUrl: string;
  appUrl: string;
}

export function InvitePartnerEmail({
  inviterName = 'Someone',
  alignmentTitle = 'an alignment',
  inviteUrl = '#',
  appUrl = 'https://alignthehumans.com',
}: InvitePartnerEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={baseStyles.body}>
        <Container style={baseStyles.container}>
          <Text style={baseStyles.heading}>
            You&apos;re invited to align
          </Text>
          <Text style={baseStyles.text}>
            <strong style={{ color: colors.text }}>{inviterName}</strong> has
            invited you to collaborate on{' '}
            <strong style={{ color: colors.text }}>{alignmentTitle}</strong>.
          </Text>
          <Text style={baseStyles.text}>
            You&apos;ll each answer questions independently, then AI will help you
            find common ground and resolve any differences.
          </Text>
          <Section style={{ textAlign: 'center', margin: '32px 0' }}>
            <Button style={baseStyles.button} href={inviteUrl}>
              Join Alignment
            </Button>
          </Section>
          <Text style={{ ...baseStyles.text, fontSize: '13px' }}>
            Or copy this link:{' '}
            <Link href={inviteUrl} style={baseStyles.link}>
              {inviteUrl}
            </Link>
          </Text>
          <Hr style={baseStyles.divider} />
          <Text style={baseStyles.footer}>
            This invite was sent from{' '}
            <Link href={appUrl} style={baseStyles.link}>
              Human Alignment
            </Link>
            . If you weren&apos;t expecting this, you can safely ignore it.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default InvitePartnerEmail;
