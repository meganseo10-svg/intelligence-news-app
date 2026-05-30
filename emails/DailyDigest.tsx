import * as React from "react";
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

export interface DigestItem {
  title: string;
  summary: string;
  category: string | null;
  salesOpportunity: string | null;
  publisher: string | null;
  url: string;
}

export interface DailyDigestProps {
  userName: string;
  date: string;
  items: DigestItem[];
  appUrl: string;
}

const main = {
  backgroundColor: "#f4f4f5",
  fontFamily: "Apple SD Gothic Neo, sans-serif",
};
const container = { maxWidth: "600px", margin: "0 auto", padding: "24px" };
const card = {
  backgroundColor: "#ffffff",
  borderRadius: "12px",
  border: "1px solid #e4e4e7",
  padding: "16px",
  marginBottom: "12px",
};

export function DailyDigest({
  userName,
  date,
  items,
  appUrl,
}: DailyDigestProps) {
  return (
    <Html lang="ko">
      <Head />
      <Preview>{`${date} 인텔리전스 브리핑 · ${items.length}건`}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={{ fontSize: "20px", margin: "0 0 4px" }}>
            📰 오늘의 인텔리전스
          </Heading>
          <Text
            style={{ color: "#71717a", fontSize: "14px", margin: "0 0 16px" }}
          >
            {userName}님, {date} · 새 뉴스 {items.length}건
          </Text>

          {items.map((it, i) => (
            <Section key={i} style={card}>
              {it.category && (
                <Text
                  style={{
                    fontSize: "12px",
                    color: "#3c3489",
                    margin: "0 0 4px",
                  }}
                >
                  {it.category} · {it.publisher ?? ""}
                </Text>
              )}
              <Link
                href={it.url}
                style={{
                  fontSize: "16px",
                  fontWeight: 600,
                  color: "#18181b",
                  textDecoration: "none",
                }}
              >
                {it.title}
              </Link>
              <Text
                style={{ fontSize: "14px", color: "#3f3f46", margin: "8px 0" }}
              >
                {it.summary}
              </Text>
              {it.salesOpportunity && (
                <Text
                  style={{
                    fontSize: "13px",
                    color: "#444",
                    backgroundColor: "#f4f4f5",
                    borderRadius: "8px",
                    padding: "10px",
                    margin: 0,
                  }}
                >
                  💡 시사점: {it.salesOpportunity}
                </Text>
              )}
            </Section>
          ))}

          <Hr style={{ borderColor: "#e4e4e7", margin: "16px 0" }} />
          <Text
            style={{ fontSize: "13px", color: "#71717a", textAlign: "center" }}
          >
            <Link href={`${appUrl}/feed`} style={{ color: "#18181b" }}>
              앱에서 전체 보기 →
            </Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default DailyDigest;
