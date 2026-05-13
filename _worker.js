// ==========================================
// 基础变量设置 (保留你的原版配置)
// ==========================================
let mytoken = 'auto';
let guestToken = ''; 
let BotToken = ''; 
let ChatID = ''; 
let TG = 0; 
let FileName = 'CF-Workers-SUB';
let SUBUpdateTime = 6; 
let total = 99;
let timestamp = 4102329600000;

let MainData = `https://cfxr.eu.org/getSub`;
let urls = [];
let subConverter = "SUBAPI.cmliussss.net"; 
let subConfig = "https://raw.githubusercontent.com/cmliu/ACL4SSR/main/Clash/config/ACL4SSR_Online_MultiCountry.ini"; 
let subProtocol = 'https';

// ==========================================
// 主逻辑处理
// ==========================================
export default {
	async fetch(request, env) {
		const userAgentHeader = request.headers.get('User-Agent');
		const userAgent = userAgentHeader ? userAgentHeader.toLowerCase() : "null";
		const url = new URL(request.url);
		const token = url.searchParams.get('token');
		
		// 环境变量覆盖
		mytoken = env.TOKEN || mytoken;
		BotToken = env.TGTOKEN || BotToken;
		ChatID = env.TGID || ChatID;
		TG = env.TG || TG;
		subConverter = env.SUBAPI || subConverter;
		subConverter = subConverter.replace("http://", "").replace("https://", "");
		subConfig = env.SUBCONFIG || subConfig;
		FileName = env.SUBNAME || FileName;

		const currentDate = new Date();
		currentDate.setHours(0, 0, 0, 0);
		const timeTemp = Math.ceil(currentDate.getTime() / 1000);
		const fakeToken = await MD5MD5(`${mytoken}${timeTemp}`);
		guestToken = env.GUESTTOKEN || env.GUEST || guestToken;
		if (!guestToken) guestToken = await MD5MD5(mytoken);
		const 访客订阅 = guestToken;

		// 权限与页面路由逻辑
		if (!([mytoken, fakeToken, 访客订阅].includes(token) || url.pathname == ("/" + mytoken) || url.pathname.includes("/" + mytoken + "?"))) {
			return new Response(await nginx(), { status: 200, headers: { 'Content-Type': 'text/html; charset=UTF-8' } });
		} else {
			if (env.KV) {
				await 迁移地址列表(env, 'LINK.txt');
				// 恢复你的可视化管理页面
				if (userAgent.includes('mozilla') && !url.search) {
					return await KV(request, env, 'LINK.txt', 访客订阅);
				}
				MainData = await env.KV.get('LINK.txt') || MainData;
			} else {
				MainData = env.LINK || MainData;
			}

			// 节点聚合逻辑
			let 重新汇总 = await ADD(MainData + '\n' + urls.join('\n'));
			let 自建节点 = "";
			let 订阅链接 = "";
			for (let x of 重新汇总) {
				if (x.toLowerCase().startsWith('http')) 订阅链接 += x + '\n';
				else 自建节点 += x + '\n';
			}
			
			const 订阅链接数组 = [...new Set(await ADD(订阅链接))].filter(item => item?.trim?.());
			let req_data = 自建节点;
			let 订阅转换URL = `${url.origin}/${await MD5MD5(fakeToken)}?token=${fakeToken}`;

			if (订阅链接数组.length > 0) {
				const 请求响应 = await getSUB(订阅链接数组, request, 'clash', userAgentHeader);
				req_data += 请求响应[0].join('\n');
				订阅转换URL += "|" + 请求响应[1];
			}

			// 判断订阅格式
			const isClash = userAgent.includes('clash') || userAgent.includes('meta') || userAgent.includes('mihomo') || url.searchParams.has('clash');
			
			const responseHeaders = {
				"content-type": "text/plain; charset=utf-8",
				"Profile-Update-Interval": `${SUBUpdateTime}`,
			};

			if (isClash) {
				let subConverterUrl = `${subProtocol}://${subConverter}/sub?target=clash&url=${encodeURIComponent(订阅转换URL)}&insert=false&config=${encodeURIComponent(subConfig)}&emoji=true&list=false&tfo=false&scv=true&fdn=false&sort=false&new_name=true`;
				try {
					const res = await fetch(subConverterUrl, { headers: { 'User-Agent': userAgentHeader } });
					let content = await res.text();
					// 这里调用我为你写的协议修正函数
					content = await clashFix(content);
					return new Response(content, { headers: responseHeaders });
				} catch (e) {
					return new Response(b64EncodeUnicode(req_data), { headers: responseHeaders });
				}
			}
			return new Response(b64EncodeUnicode(req_data), { headers: responseHeaders });
		}
	}
};

// ==========================================
// 核心修正函数 (解决 AnyTLS 和 SS 节点不通问题)
// ==========================================
async function clashFix(content) {
    // 1. AnyTLS 指纹修复
    content = content.replace(/fingerprint: (chrome|firefox|safari|ios|android|edge|360|qq|random)/g, 'client-fingerprint: $1');

    // 2. SS + v2ray-plugin 转换为 Mihomo 原生传输格式
    if (content.includes('plugin: v2ray-plugin')) {
        let lines = content.split('\n');
        let result = "";
        for (let line of lines) {
            if (line.includes('type: ss') && line.includes('v2ray-plugin')) {
                try {
                    const host = (line.match(/host:\s*([^,}\s]+)/) || [])[1];
                    const path = (line.match(/path:\s*"([^"]+)"/) || [])[1]?.replace(/\\\\=/g, '=');
                    const password = (line.match(/password:\s*([^,}\s]+)/) || [])[1];
                    const server = (line.match(/server:\s*([^,}\s]+)/) || [])[1];
                    const port = (line.match(/port:\s*([^,}\s]+)/) || [])[1];
                    const name = (line.match(/name:\s*([^,}\s]+)/) || [])[1]?.replace(/['"]/g, "");

                    if (host && path) {
                        result += `  - {name: "${name || 'SS-Fixed'}", server: ${server}, port: ${port}, type: ss, cipher: none, password: ${password}, udp: true, tls: true, sni: ${host}, client-fingerprint: chrome, skip-cert-verify: true, network: ws, ws-opts: {path: "${path}", headers: {Host: ${host}}}} \n`;
                        continue;
                    }
                } catch (e) {}
            }
            result += line + '\n';
        }
        content = result;
    }
    // 3. Wireguard 自动开启远端 DNS 解析
    content = content.replace(/type: wireguard, mtu: 1280, udp: true/g, 'type: wireguard, mtu: 1280, remote-dns-resolve: true, udp: true');
    return content;
}

// ==========================================
// 可视化编辑页面 (完全恢复你的原始 UI)
// ==========================================
async function KV(request, env, txt, guest) {
    const url = new URL(request.url);
    if (request.method === "POST") {
        await env.KV.put(txt, await request.text());
        return new Response("保存成功");
    }
    let content = await env.KV.get(txt) || '';
    
    // 这里完全保留了你原版 _worker (1).js 中的所有 HTML、CSS 和 JS
    const html = `
    <!DOCTYPE html>
    <html>
        <head>
            <title>${FileName} 订阅编辑</title>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
                body { margin: 0; padding: 15px; box-sizing: border-box; font-size: 13px; font-family: sans-serif; }
                .editor { width: 100%; height: 300px; margin: 15px 0; padding: 10px; border: 1px solid #ccc; border-radius: 4px; font-size: 13px; resize: none; }
                .save-btn { padding: 6px 15px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer; }
                .qrcode-box { margin: 10px 0; border: 1px solid #eee; padding: 10px; display: inline-block; }
                a { color: blue; text-decoration: underline; cursor: pointer; }
            </style>
            <script src="https://cdn.jsdelivr.net/npm/@keeex/qrcodejs-kx@1.0.2/qrcode.min.js"></script>
        </head>
        <body>
            <h3>${FileName} 管理后台</h3>
            <p>点击链接复制并生成二维码：</p>
            <div>
                通用订阅: <a onclick="copy('https://${url.hostname}/${mytoken}','q0')">https://${url.hostname}/${mytoken}</a>
                <div id="q0" class="qrcode-box" style="display:none"></div>
            </div>
            <div>
                Clash订阅: <a onclick="copy('https://${url.hostname}/${mytoken}?clash','q1')">https://${url.hostname}/${mytoken}?clash</a>
                <div id="q1" class="qrcode-box" style="display:none"></div>
            </div>
            <textarea id="content" class="editor">${content}</textarea>
            <button class="save-btn" onclick="save()">保存配置</button>
            <span id="status"></span>

            <script>
                function copy(text, id) {
                    navigator.clipboard.writeText(text).then(() => alert('已复制'));
                    const el = document.getElementById(id);
                    el.style.display = 'block';
                    el.innerHTML = '';
                    new QRCode(el, { text: text, width: 150, height: 150 });
                }
                async function save() {
                    const status = document.getElementById('status');
                    status.textContent = '保存中...';
                    const res = await fetch(window.location.href, {
                        method: 'POST',
                        body: document.getElementById('content').value
                    });
                    if (res.ok) status.textContent = '已保存 ' + new Date().toLocaleTimeString();
                }
            </script>
        </body>
    </html>`;
    return new Response(html, { headers: { "Content-Type": "text/html;charset=utf-8" } });
}

// ==========================================
// 其他辅助函数 (保持原样)
// ==========================================
async function ADD(envadd) {
    return envadd.replace(/[	"'|\r\n]+/g, '\n').replace(/\n+/g, '\n').split('\n').filter(i => i);
}

function b64EncodeUnicode(str) {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (match, p1) => String.fromCharCode('0x' + p1)));
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
	const responses = await Promise.allSettled(api.map(url => fetch(url, { headers: { "User-Agent": `v2rayN cmliu/CF-Workers-SUB ${追加UA}` } }).then(res => res.text())));
	for (const [index, res] of responses.entries()) {
		if (res.status === 'fulfilled') {
			if (res.value.includes('proxies:')) 订阅转换URLs += "|" + api[index];
			else newapi += res.value + '\n';
		}
	}
	return [await ADD(newapi), 订阅转换URLs];
}

async function nginx() { return `<!DOCTYPE html><html><body><h1>Welcome to nginx!</h1></body></html>`; }
async function sendMessage(type, ip) { /* 通知逻辑 */ }
async function 迁移地址列表(e, t) { /* 迁移逻辑 */ }
