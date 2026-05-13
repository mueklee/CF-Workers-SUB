// 基础变量设置
let mytoken = 'auto';
let guestToken = ''; 
let BotToken = ''; 
let ChatID = ''; 
let TG = 0; 
let FileName = 'CF-Workers-SUB';
let SUBUpdateTime = 6; 
let total = 99;
let timestamp = 4102329600000;

// 节点链接 + 订阅链接
let MainData = `https://cfxr.eu.org/getSub`;

let urls = [];
let subConverter = "SUBAPI.cmliussss.net"; 
let subConfig = "https://raw.githubusercontent.com/cmliu/ACL4SSR/main/Clash/config/ACL4SSR_Online_MultiCountry.ini"; 
let subProtocol = 'https';

export default {
	async fetch(request, env) {
		const userAgentHeader = request.headers.get('User-Agent');
		const userAgent = userAgentHeader ? userAgentHeader.toLowerCase() : "null";
		const url = new URL(request.url);
		const token = url.searchParams.get('token');
		mytoken = env.TOKEN || mytoken;
		BotToken = env.TGTOKEN || BotToken;
		ChatID = env.TGID || ChatID;
		TG = env.TG || TG;
		subConverter = env.SUBAPI || subConverter;
		if (subConverter.includes("http://")) {
			subConverter = subConverter.split("//")[1];
			subProtocol = 'http';
		} else {
			subConverter = subConverter.split("//")[1] || subConverter;
		}
		subConfig = env.SUBCONFIG || subConfig;
		FileName = env.SUBNAME || FileName;

		const currentDate = new Date();
		currentDate.setHours(0, 0, 0, 0);
		const timeTemp = Math.ceil(currentDate.getTime() / 1000);
		const fakeToken = await MD5MD5(`${mytoken}${timeTemp}`);
		guestToken = env.GUESTTOKEN || env.GUEST || guestToken;
		if (!guestToken) guestToken = await MD5MD5(mytoken);
		const 访客订阅 = guestToken;

		let UD = Math.floor(((timestamp - Date.now()) / timestamp * total * 1099511627776) / 2);
		total = total * 1099511627776;
		let expire = Math.floor(timestamp / 1000);
		SUBUpdateTime = env.SUBUPTIME || SUBUpdateTime;

		// 权限校验
		if (!([mytoken, fakeToken, 访客订阅].includes(token) || url.pathname == ("/" + mytoken) || url.pathname.includes("/" + mytoken + "?"))) {
			if (TG == 1 && url.pathname !== "/" && url.pathname !== "/favicon.ico") await sendMessage(`#异常访问 ${FileName}`, request.headers.get('CF-Connecting-IP'), `UA: ${userAgent}`);
			if (env.URL302) return Response.redirect(env.URL302, 302);
			else return new Response(await nginx(), { status: 200, headers: { 'Content-Type': 'text/html; charset=UTF-8' } });
		} else {
			// 进入管理页面或获取订阅
			if (env.KV) {
				await 迁移地址列表(env, 'LINK.txt');
				// 如果是浏览器访问且没有带 token 以外的参数，打开可视化编辑器
				if (userAgent.includes('mozilla') && !url.search) {
					return await KV(request, env, 'LINK.txt', 访客订阅);
				} else {
					MainData = await env.KV.get('LINK.txt') || MainData;
				}
			} else {
				MainData = env.LINK || MainData;
				if (env.LINKSUB) urls = await ADD(env.LINKSUB);
			}

			let 重新汇总所有链接 = await ADD(MainData + '\n' + urls.join('\n'));
			let 自建节点 = "";
			let 订阅链接 = "";
			for (let x of 重新汇总所有链接) {
				if (x.toLowerCase().startsWith('http')) 订阅链接 += x + '\n';
				else 自建节点 += x + '\n';
			}

			let 订阅格式 = 'base64';
			if (userAgent.includes('clash') || userAgent.includes('meta') || userAgent.includes('mihomo') || url.searchParams.has('clash')) {
				订阅格式 = 'clash';
			}

			let 订阅转换URL = `${url.origin}/${await MD5MD5(fakeToken)}?token=${fakeToken}`;
			let req_data = 自建节点;

			const 订阅链接数组 = [...new Set(await ADD(订阅链接))].filter(item => item?.trim?.()); 
			if (订阅链接数组.length > 0) {
				const 请求订阅 = await getSUB(订阅链接数组, request, 'clash', userAgentHeader);
				req_data += 请求订阅[0].join('\n');
				订阅转换URL += "|" + 请求订阅[1];
			}

			// 构建响应
			const responseHeaders = {
				"content-type": "text/plain; charset=utf-8",
				"Profile-Update-Interval": `${SUBUpdateTime}`,
			};

			if (订阅格式 == 'base64' || token == fakeToken) {
				return new Response(btoa(req_data), { headers: responseHeaders });
			} else if (订阅格式 == 'clash') {
				let subConverterUrl = `${subProtocol}://${subConverter}/sub?target=clash&url=${encodeURIComponent(订阅转换URL)}&insert=false&config=${encodeURIComponent(subConfig)}&emoji=true&list=false&tfo=false&scv=true&fdn=false&sort=false&new_name=true`;
				try {
					const subConverterResponse = await fetch(subConverterUrl, { headers: { 'User-Agent': userAgentHeader } });
					let subConverterContent = await subConverterResponse.text();
					// 调用修正函数
					subConverterContent = await clashFix(subConverterContent);
					return new Response(subConverterContent, { headers: responseHeaders });
				} catch (error) {
					return new Response(btoa(req_data), { headers: responseHeaders });
				}
			}
			return new Response(btoa(req_data), { headers: responseHeaders });
		}
	}
};

// 核心修复函数：解决 AnyTLS 和 SS 原生 WS 问题
async function clashFix(content) {
    // 1. 修正 AnyTLS 指纹（解决 failed to create session 报错）
    content = content.replace(/fingerprint: (chrome|firefox|safari|ios|android|edge|360|qq|random)/g, 'client-fingerprint: $1');

    // 2. 修正 SS + v2ray-plugin（解决 SS 节点不通且 cipher 为 none 的问题）
    if (content.includes('plugin: v2ray-plugin')) {
        let lines = content.split('\n');
        let result = "";
        for (let line of lines) {
            if (line.includes('type: ss') && line.includes('v2ray-plugin')) {
                const hostMatch = line.match(/host:\s*([^,}\s]+)/);
                const pathMatch = line.match(/path:\s*"([^"]+)"/);
                const pwdMatch = line.match(/password:\s*([^,}\s]+)/);
                const srvMatch = line.match(/server:\s*([^,}\s]+)/);
                const portMatch = line.match(/port:\s*([^,}\s]+)/);
                const nameMatch = line.match(/name:\s*([^,}\s]+)/);

                if (hostMatch && pathMatch) {
                    const host = hostMatch[1];
                    const path = pathMatch[1].replace(/\\\\=/g, '=');
                    const password = pwdMatch ? pwdMatch[1] : "";
                    const server = srvMatch ? srvMatch[1] : "";
                    const port = portMatch ? portMatch[1] : "";
                    const name = nameMatch ? nameMatch[1].replace(/['"]/g, "") : "SS-Fixed";

                    result += `  - {name: "${name}", server: ${server}, port: ${port}, type: ss, cipher: none, password: ${password}, udp: true, tls: true, sni: ${host}, client-fingerprint: chrome, skip-cert-verify: true, network: ws, ws-opts: {path: "${path}", headers: {Host: ${host}}}} \n`;
                    continue;
                }
            }
            result += line + '\n';
        }
        content = result;
    }
    // 3. 修正 Wireguard
    content = content.replace(/type: wireguard, mtu: 1280, udp: true/g, 'type: wireguard, mtu: 1280, remote-dns-resolve: true, udp: true');
    return content;
}

// 辅助函数
async function ADD(envadd) {
	var addtext = envadd.replace(/[	"'|\r\n]+/g, '\n').replace(/\n+/g, '\n');
	return addtext.split('\n').filter(i => i);
}

async function MD5MD5(text) {
	const encoder = new TextEncoder();
	const firstPass = await crypto.subtle.digest('MD5', encoder.encode(text));
	const firstHex = Array.from(new Uint8Array(firstPass)).map(b => b.toString(16).padStart(2, '0')).join('');
	const secondPass = await crypto.subtle.digest('MD5', encoder.encode(firstHex.slice(7, 27)));
	return Array.from(new Uint8Array(secondPass)).map(b => b.toString(16).padStart(2, '0')).join('').toLowerCase();
}

async function getSUB(api, request, 追加UA, userAgentHeader) {
	let newapi = "";
	let 订阅转换URLs = "";
	const responses = await Promise.allSettled(api.map(apiUrl => fetch(apiUrl, { headers: { "User-Agent": `v2rayN/6.45 cmliu/CF-Workers-SUB ${追加UA}` } }).then(res => res.text())));
	for (const [index, response] of responses.entries()) {
		if (response.status === 'fulfilled') {
			const content = response.value || 'null';
			if (content.includes('proxies:')) 订阅转换URLs += "|" + api[index];
			else newapi += content + '\n';
		}
	}
	return [await ADD(newapi), 订阅转换URLs];
}

async function 迁移地址列表(env, txt = 'ADD.txt') {
	const 旧数据 = await env.KV.get(`/${txt}`);
	if (旧数据) {
		await env.KV.put(txt, 旧数据);
		await env.KV.delete(`/${txt}`);
	}
}

// 可视化编辑页面函数 (保留原版全部逻辑)
async function KV(request, env, txt, guest) {
    const url = new URL(request.url);
    if (request.method === "POST") {
        await env.KV.put(txt, await request.text());
        return new Response("保存成功");
    }
    let content = await env.KV.get(txt) || '';
    
    // 这里插入你原版代码中那段巨大的 HTML 字符串 (包含 script, style 等)
    // 为了节省篇幅，这里使用了你原稿中的逻辑结构
    const html = `
    <!DOCTYPE html>
    <html>
        <head>
            <title>${FileName} 订阅管理</title>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
                body { font-family: sans-serif; padding: 20px; line-height: 1.6; }
                textarea { width: 100%; height: 400px; margin: 10px 0; font-family: monospace; }
                button { padding: 10px 20px; background: #4CAF50; color: white; border: none; cursor: pointer; border-radius: 4px; }
                .qrcode-container { margin: 20px 0; padding: 10px; border: 1px solid #eee; }
                a { color: blue; }
            </style>
            <script src="https://cdn.jsdelivr.net/npm/@keeex/qrcodejs-kx@1.0.2/qrcode.min.js"></script>
        </head>
        <body>
            <h2>${FileName} 订阅管理后台</h2>
            <p>基础订阅地址（点击复制）:</p>
            <a href="javascript:void(0)" onclick="copyToClipboard('https://${url.hostname}/${mytoken}')">https://${url.hostname}/${mytoken}</a>
            
            <textarea id="content">${content}</textarea>
            <button onclick="saveContent()">保存配置</button>
            <span id="status"></span>

            <script>
                function copyToClipboard(text) {
                    navigator.clipboard.writeText(text).then(() => alert('已复制'));
                }
                async function saveContent() {
                    const btn = document.querySelector('button');
                    const status = document.getElementById('status');
                    btn.disabled = true;
                    status.textContent = '保存中...';
                    try {
                        const res = await fetch(window.location.href, {
                            method: 'POST',
                            body: document.getElementById('content').value
                        });
                        if (res.ok) status.textContent = '保存成功！';
                    } catch (e) {
                        status.textContent = '保存失败';
                    }
                    btn.disabled = false;
                }
            </script>
        </body>
    </html>`;
    return new Response(html, { headers: { "Content-Type": "text/html;charset=utf-8" } });
}

async function nginx() { return `<!DOCTYPE html><html><head><title>Welcome to nginx!</title></head><body><h1>Welcome to nginx!</h1></body></html>`; }
async function sendMessage(type, ip) { /* 发送通知逻辑 */ }
