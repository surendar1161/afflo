"use client";
import { useEffect, useState } from "react";
import { Table, Button, Tag, Space, Typography, App, Card, Empty } from "antd";
import { CopyOutlined, CheckOutlined, LinkOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";

const { Title, Text } = Typography;
type Link = { id:string; short_code:string; name:string|null; tracking_url:string; click_count:number; conversion_count:number; program?:{name:string} };

export default function PortalLinks() {
  const { message } = App.useApp();
  const [links, setLinks]   = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied]   = useState<string|null>(null);

  useEffect(() => { fetch("/api/portal/links").then(r=>r.json()).then(d=>{ setLinks(d.links||[]); setLoading(false); }); }, []);

  const copy = (url: string, code: string) => {
    navigator.clipboard.writeText(url);
    message.success("Link copied!");
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  };

  const cols: ColumnsType<Link> = [
    { title:"Program", dataIndex:["program","name"], render:v=><Text strong style={{color:"#f5f5f5"}}>{v||"—"}</Text> },
    { title:"Tracking URL", render:(_,l)=>(
      <Text style={{color:"#2C5CC5",fontFamily:"monospace",fontSize:13}}><LinkOutlined style={{marginRight:6}} />{l.tracking_url}</Text>
    )},
    { title:"Clicks",      dataIndex:"click_count",      render:v=><Text style={{color:"#475867",fontWeight:600}}>{v}</Text> },
    { title:"Conversions", dataIndex:"conversion_count", render:v=><Text style={{color:"#475867",fontWeight:600}}>{v}</Text> },
    { title:"Actions", render:(_,l)=>(
      <Button size="small" icon={copied===l.short_code?<CheckOutlined/>:<CopyOutlined/>}
        onClick={()=>copy(l.tracking_url,l.short_code)}
        style={copied===l.short_code?{color:"#00875A",borderColor:"#00875A"}:{}}>
        {copied===l.short_code?"Copied!":"Copy"}
      </Button>
    )},
  ];

  return (
    <div>
      <div style={{marginBottom:28}}>
        <Title level={2} style={{margin:"0 0 4px",color:"#f5f5f5"}}>My Links</Title>
        <Text style={{color:"#8fa0b4"}}>Your affiliate tracking links. Share these to earn commissions.</Text>
      </div>
      <Card styles={{body:{padding:0}}}>
        <Table columns={cols} dataSource={links} rowKey="id" loading={loading}
          locale={{emptyText:<Empty description="No links yet — contact your program manager." image={Empty.PRESENTED_IMAGE_SIMPLE}/>}}
          pagination={{pageSize:20,showSizeChanger:false}} />
      </Card>
    </div>
  );
}
