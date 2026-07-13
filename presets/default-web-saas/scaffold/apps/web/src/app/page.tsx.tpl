"use client";

import {
  App,
  Alert,
  Button,
  Card,
  ConfigProvider,
  Layout,
  Space,
  Table,
  Tag,
  Typography
} from "antd";
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  PlusOutlined,
  ProfileOutlined,
  ProjectOutlined,
  SafetyCertificateOutlined
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";

type WorkItem = {
  key: string;
  fluxo: string;
  status: "Pronto" | "Em revisao" | "Pendente";
  responsavel: string;
  prazo: string;
};

const items: WorkItem[] = [
  {
    key: "1",
    fluxo: "Brief aprovado",
    status: "Pronto",
    responsavel: "Produto",
    prazo: "Hoje"
  },
  {
    key: "2",
    fluxo: "Arquitetura da primeira entrega",
    status: "Em revisao",
    responsavel: "Tecnologia",
    prazo: "Amanha"
  },
  {
    key: "3",
    fluxo: "Primeiro fluxo do usuario",
    status: "Pendente",
    responsavel: "Negocio",
    prazo: "Definir"
  }
];

const columns: ColumnsType<WorkItem> = [
  {
    title: "Fluxo",
    dataIndex: "fluxo",
    key: "fluxo"
  },
  {
    title: "Status",
    dataIndex: "status",
    key: "status",
    render: (status: WorkItem["status"]) => {
      const color =
        status === "Pronto" ? "green" : status === "Pendente" ? "gold" : "cyan";
      return <Tag color={color}>{status}</Tag>;
    }
  },
  {
    title: "Responsavel",
    dataIndex: "responsavel",
    key: "responsavel"
  },
  {
    title: "Prazo",
    dataIndex: "prazo",
    key: "prazo"
  }
];

export default function HomePage() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#0f766e",
          borderRadius: 8,
          fontFamily:
            "Aptos, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
        }
      }}
    >
      <App>
        <Layout className="app-shell">
          <Layout.Sider breakpoint="lg" collapsedWidth={0} className="app-sidebar">
            <div className="brand-block">
              <Typography.Text className="brand-kicker">Workspace</Typography.Text>
              <Typography.Title level={4} className="brand">
                {{PROJECT_NAME}}
              </Typography.Title>
            </div>
            <nav className="nav-list" aria-label="Navegacao principal">
              <a href="/" aria-current="page">
                <ProjectOutlined /> Painel
              </a>
              <a href="/">
                <ProfileOutlined /> Solicitacoes
              </a>
              <a href="/">
                <SafetyCertificateOutlined /> Qualidade
              </a>
            </nav>
          </Layout.Sider>
          <Layout>
            <Layout.Header className="app-header">
              <Button icon={<ArrowLeftOutlined />} className="back-button">
                Voltar
              </Button>
              <Space size={12} wrap>
                <Button>Cancelar</Button>
                <Button type="primary" icon={<PlusOutlined />}>
                  Nova solicitacao
                </Button>
              </Space>
            </Layout.Header>

            <Layout.Content className="app-content">
              <section className="page-heading">
                <div>
                  <Typography.Text className="eyebrow">Visao operacional</Typography.Text>
                  <Typography.Title level={1}>Acompanhe a primeira entrega</Typography.Title>
                  <Typography.Paragraph>
                    Base inicial para o time transformar requisitos em fluxos testaveis,
                    com acoes claras, estados visiveis e navegacao de retorno.
                  </Typography.Paragraph>
                </div>
                <Alert
                  showIcon
                  type="success"
                  message="Ambiente pronto para evoluir"
                  description="Use esta tela como ponto de partida e substitua os dados pelos fluxos reais da feature."
                  className="status-alert"
                />
              </section>

              <section className="metric-grid" aria-label="Resumo">
                <Card className="metric-card">
                  <Space align="start">
                    <CheckCircleOutlined className="metric-icon success" />
                    <div>
                      <Typography.Text type="secondary">Prontos</Typography.Text>
                      <Typography.Title level={2}>1</Typography.Title>
                    </div>
                  </Space>
                </Card>
                <Card className="metric-card">
                  <Space align="start">
                    <ClockCircleOutlined className="metric-icon warning" />
                    <div>
                      <Typography.Text type="secondary">Em andamento</Typography.Text>
                      <Typography.Title level={2}>1</Typography.Title>
                    </div>
                  </Space>
                </Card>
                <Card className="metric-card">
                  <Space align="start">
                    <ProfileOutlined className="metric-icon neutral" />
                    <div>
                      <Typography.Text type="secondary">Pendencias</Typography.Text>
                      <Typography.Title level={2}>1</Typography.Title>
                    </div>
                  </Space>
                </Card>
              </section>

              <Card
                title="Plano inicial"
                extra={<Button type="link">Ver detalhes</Button>}
                className="table-card"
              >
                <Table
                  columns={columns}
                  dataSource={items}
                  pagination={false}
                  size="middle"
                  scroll={{ x: true }}
                />
              </Card>
            </Layout.Content>
          </Layout>
        </Layout>
      </App>
    </ConfigProvider>
  );
}
