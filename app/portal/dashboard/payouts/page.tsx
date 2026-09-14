"use client";
import { useEffect, useState } from "react";
import { Table, Tag, Typography, Card, Row, Col, Statistic, Spin, Empty } from "antd";
import { DollarOutlined, ClockCircleOutlined, CheckCircleOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";

const { Title, Text } = Typography;
type Payout = { id:string; amount:number; currency:string; method:string; status:string; created_at:string; paid_at:string|null; program?:{name:string} };
const STATUS_COLOR: Record<string,string> = { pending:"warning", processing:"processing", paid:"success", failed:"error" };

export default function PortalPayouts() {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [stats, setStats]     = useState<{total:number;paid:number;pending:number}>({total:0,paid:0,pending:0});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/portal/payouts").then(r=>r.json()).then(d=>{
      setPayouts(d.payouts||[]); setStats(d.stats||{total:0,paid:0,pending:0}); setLoading(false);
    });
  }, []);

  const cols: ColumnsType<Payout> = [
    { title:"Program",  render:(_,p)=><Text strong style={{color:"#f5f5f5"}}>{p.program?.name||"—"}</Text> },
    { title:"Amount",   render:(_,p)=><Text style={{color:"#f5f5f5",fontWeight:700}}>${p.amount.toFixed(2)} <span style={{color:"#a0b0c0",fontSize:11}}>{p.currency}</span></Text> },
    { title:"Method",   dataIndex:"method", render:v=><Text style={{color:"#8fa0b4",textTransform:"capitalize"}}>{v?.replace("_"," ")}</Text> },
    { title:"Status",   dataIndex:"status", render:s=><Tag color={STATUS_COLOR[s]||"default"} style={{textTransform:"capitalize"}}>{s}</Tag> },
    { title:"Date",     render:(_,p)=><Text style={{color:"#a0b0c0",fontSize:12}}>{p.paid_at?new Date(p.paid_at).toLocaleDateString():new Date(p.created_at).toLocaleDateString()}</Text> },
  ];

  if (loading) return <div style={{display:"flex",justifyContent:"center",padding:80}}><Spin size="large"/></div>;

  return (
    <div>
      <div style={{marginBottom:28}}>
        <Title level={2} style={{margin:"0 0 4px",color:"#f5f5f5"}}>Payouts</Title>
        <Text style={{color:"#8fa0b4"}}>Your commission payment history.</Text>
      </div>
      <Row gutter={[14,14]} style={{marginBottom:24}}>
        <Col xs={24} sm={8}><Card><Statistic title="Total Earned" value={stats.total} prefix={<DollarOutlined/>} precision={2} valueStyle={{color:"#f5f5f5"}}/></Card></Col>
        <Col xs={24} sm={8}><Card><Statistic title="Paid Out" value={stats.paid} prefix={<CheckCircleOutlined style={{color:"#00875A"}}/>} precision={2} valueStyle={{color:"#00875A"}}/></Card></Col>
        <Col xs={24} sm={8}><Card><Statistic title="Pending" value={stats.pending} prefix={<ClockCircleOutlined style={{color:"#FFC639"}}/>} precision={2} valueStyle={{color:"#FFC639"}}/></Card></Col>
      </Row>
      <Card styles={{body:{padding:0}}}>
        <Table columns={cols} dataSource={payouts} rowKey="id"
          locale={{emptyText:<Empty description="No payouts yet." image={Empty.PRESENTED_IMAGE_SIMPLE}/>}}
          pagination={{pageSize:20,showSizeChanger:false}}/>
      </Card>
    </div>
  );
}
