"use client";
import { useEffect, useState } from "react";
import { Form, Input, Button, Card, Typography, Spin, App, Divider } from "antd";
import { createClient } from "@/lib/supabase/client";

const { Title, Text } = Typography;
const INPUT_STYLE = {
  WebkitTextFillColor: "#f5f5f5" as const,
  WebkitBoxShadow: "0 0 0 1000px rgba(30,30,30,0.98) inset" as const,
};

export default function PortalSettings() {
  const { message } = App.useApp();
  const [aff, setAff]     = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [form] = Form.useForm();
  const [pwForm] = Form.useForm();

  useEffect(() => {
    fetch("/api/portal/me").then(r=>r.json()).then(d=>{
      setAff(d.affiliate);
      form.setFieldsValue({ full_name:d.affiliate?.full_name||"", website:d.affiliate?.website||"", bio:d.affiliate?.bio||"" });
      setLoading(false);
    });
  }, []);

  const saveProfile = async (values: any) => {
    setSaving(true);
    const supabase = createClient();
    const { data:{user} } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("affiliates").update(values).eq("auth_user_id", user.id);
    message.success("Profile updated!");
    setSaving(false);
  };

  const changePassword = async (values: { current:string; newPass:string }) => {
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: values.newPass });
    if (error) message.error(error.message);
    else { message.success("Password updated!"); pwForm.resetFields(); }
  };

  if (loading) return <div style={{display:"flex",justifyContent:"center",padding:80}}><Spin size="large"/></div>;

  return (
    <div style={{maxWidth:560}}>
      <div style={{marginBottom:28}}>
        <Title level={2} style={{margin:"0 0 4px",color:"#f5f5f5"}}>Settings</Title>
        <Text style={{color:"#8fa0b4"}}>Update your affiliate profile and account settings.</Text>
      </div>

      <Card title={<Text strong style={{color:"#f5f5f5"}}>Profile</Text>} style={{marginBottom:20}}>
        <Form form={form} layout="vertical" onFinish={saveProfile}>
          <Form.Item name="full_name" label="Full name"><Input style={INPUT_STYLE}/></Form.Item>
          <Form.Item name="website" label="Website"><Input placeholder="https://yourblog.com" style={INPUT_STYLE}/></Form.Item>
          <Form.Item name="bio" label="Bio"><Input.TextArea rows={3} placeholder="Tell brands about yourself…"/></Form.Item>
          <Button type="primary" htmlType="submit" loading={saving} style={{fontWeight:600}}>Save profile</Button>
        </Form>
      </Card>

      <Card title={<Text strong style={{color:"#f5f5f5"}}>Change password</Text>}>
        <Form form={pwForm} layout="vertical" onFinish={changePassword}>
          <Form.Item name="newPass" label="New password" rules={[{required:true,min:8,message:"Min. 8 characters"}]}>
            <Input.Password style={INPUT_STYLE}/>
          </Form.Item>
          <Form.Item name="confirm" label="Confirm password" dependencies={["newPass"]}
            rules={[{required:true},{validator:(_,v)=>v===pwForm.getFieldValue("newPass")?Promise.resolve():Promise.reject("Passwords don't match")}]}>
            <Input.Password style={INPUT_STYLE}/>
          </Form.Item>
          <Button htmlType="submit" style={{fontWeight:600}}>Update password</Button>
        </Form>
      </Card>
    </div>
  );
}
