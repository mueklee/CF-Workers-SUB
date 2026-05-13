// 部署完成后在网址后面加上这个，获取自建节点和机场聚合节点，/?token=auto或/auto或

let mytoken = 'auto';
let guestToken = ''; 
let BotToken = ''; 
let ChatID = ''; 
let TG = 0; 
let FileName = 'CF-Workers-SUB';
let SUBUpdateTime = 6; 
let total = 99;//TB
let timestamp = 4102329600000;//2099-12-31

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

		if (!([mytoken, fakeToken, 访客订阅].includes(token) || url.pathname == ("/" + mytoken) || url.pathname.includes("/" + mytoken + "?"))) {
			if (TG == 1 && url.pathname !== "/" && url.pathname !== "/favicon.ico") await sendMessage(`#异常访问 ${FileName}`, request.headers.get('CF-Connecting-IP'), `UA: ${userAgent}</tg-spoiler>\n域名: ${url.hostname}\n<tg-spoiler>入口: ${url.pathname + url.search}</tg-spoiler>`);
			if (env.URL302) return Response.redirect(env.URL302, 302);
			else if (env.URL) return await proxyURL(env.URL, url);
			else return new Response(await nginx(), {
				status: 200,
				headers: { 'Content-Type': 'text/html; charset=UTF-8' },
			});
		} else {
			if (env.KV) {
				await 迁移地址列表(env, 'LINK.txt');
				if (userAgent.includes('mozilla') && !url.search) {
					await sendMessage(`#编辑订阅 ${FileName}`, request.headers.get('CF-Connecting-IP'), `UA: ${userAgentHeader}</tg-spoiler>\n域名: ${url.hostname}\n<tg-spoiler>入口: ${url.pathname + url.search}</tg-spoiler>`);
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
			MainData = 自建节点;
			urls = await ADD(订阅链接);
			await sendMessage(`#获取订阅 ${FileName}`, request.headers.get('CF-Connecting-IP'), `UA: ${userAgentHeader}</tg-spoiler>\n域名: ${url.hostname}\n<tg-spoiler>入口: ${url.pathname + url.search}</tg-spoiler>`);
			const isSubConverterRequest = request.headers.get('subconverter-request') || request.headers.get('subconverter-version') || userAgent.includes('subconverter');
			let 订阅格式 = 'base64';
			if (!(userAgent.includes('null') || isSubConverterRequest || userAgent.includes('nekobox') || userAgent.includes(('CF-Workers-SUB').toLowerCase()))) {
				if (userAgent.includes('sing-box') || userAgent.includes('singbox') || url.searchParams.has('sb') || url.searchParams.has('singbox')) 订阅格式 = 'singbox';
				else if (userAgent.includes('surge') || url.searchParams.has('surge')) 订阅格式 = 'surge';
				else if (userAgent.includes('quantumult') || url.searchParams.has('quanx')) 订阅格式 = 'quanx';
				else if (userAgent.includes('loon') || url.searchParams.has('loon')) 订阅格式 = 'loon';
				else if (userAgent.includes('clash') || userAgent.includes('meta') || userAgent.includes('mihomo') || url.searchParams.has('clash')) 订阅格式 = 'clash';
			}

			let subConverterUrl;
			let 订阅转换URL = `${url.origin}/${await MD5MD5(fakeToken)}?token=${fakeToken}`;
			let req_data = MainData;

			let 追加UA = 'v2rayn';
			if (url.searchParams.has('b64') || url.searchParams.has('base64')) 订阅格式 = 'base64';
			else if (url.searchParams.has('clash')) 追加UA = 'clash';
			else if (url.searchParams.has('singbox')) 追加UA = 'singbox';
			else if (url.searchParams.has('surge')) 追加UA = 'surge';
			else if (url.searchParams.has('quanx')) 追加UA = 'Quantumult%20X';
			else if (url.searchParams.has('loon')) 追加UA = 'Loon';

			const 订阅链接数组 = [...new Set(urls)].filter(item => item?.trim?.()); 
			if (订阅链接数组.length > 0) {
				const 请求订阅响应内容 = await getSUB(订阅链接数组, request, 追加UA, userAgentHeader);
				req_data += 请求订阅响应内容[0].join('\n');
				订阅转换URL += "|" + 请求订阅响应内容[1];
				if (订阅格式 == 'base64' && !isSubConverterRequest && 请求订阅响应内容[1].includes('://')) {
					subConverterUrl = `${subProtocol}://${subConverter}/sub?target=mixed&url=${encodeURIComponent(请求订阅响应内容[1])}&insert=false&config=${encodeURIComponent(subConfig)}&emoji=true&list=false&tfo=false&scv=true&fdn=false&sort=false&new_name=true`;
					try {
						const subConverterResponse = await fetch(subConverterUrl, { headers: { 'User-Agent': 'v2rayN/CF-Workers-SUB' } });
						if (subConverterResponse.ok) {
							const subConverterContent = await subConverterResponse.text();
							req_data += '\n' + atob(subConverterContent);
						}
					} catch (error) {}
				}
			}

			if (env.WARP) 订阅转换URL += "|" + (await ADD(env.WARP)).join("|");
			const utf8Encoder = new TextEncoder();
			const encodedData = utf8Encoder.encode(req_data);
			const utf8Decoder = new TextDecoder();
			const text = utf8Decoder.decode(encodedData);

			const uniqueLines = new Set(text.split('\n'));
			const result = [...uniqueLines].join('\n');

			let base64Data;
			try {
				base64Data = btoa(result);
			} catch (e) {
				function encodeBase64(data) {
					const binary = new TextEncoder().encode(data);
					let base64 = '';
					const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
					for (let i = 0; i < binary.length; i += 3) {
						const byte1 = binary[i];
						const byte2 = binary[i + 1] || 0;
						const byte3 = binary[i + 2] || 0;
						base64 += chars[byte1 >> 2];
						base64 += chars[((byte1 & 3) << 4) | (byte2 >> 4)];
						base64 += chars[((byte2 & 15) << 2) | (byte3 >> 6)];
						base64 += chars[byte3 & 63];
					}
					const padding = 3 - (binary.length % 3 || 3);
					return base64.slice(0, base64.length - padding) + '=='.slice(0, padding);
				}
				base64Data = encodeBase64(result)
			}

			const responseHeaders = {
				"content-type": "text/plain; charset=utf-8",
				"Profile-Update-Interval": `${SUBUpdateTime}`,
				"Profile-web-page-url": request.url.includes('?') ? request.url.split('?')[0] : request.url,
			};

			if (订阅格式 == 'base64' || token == fakeToken) {
				return new Response(base64Data, { headers: responseHeaders });
			} else {
                let target = 订阅格式;
                if (target === 'clash') target = 'clash';
				subConverterUrl = `${subProtocol}://${subConverter}/sub?target=${target}&url=${encodeURIComponent(订阅转换URL)}&insert=false&config=${encodeURIComponent(subConfig)}&emoji=true&list=false&tfo=false&scv=true&fdn=false&sort=false&new_name=true`;
                if (target === 'surge') subConverterUrl += '&ver=4';
                if (target === 'quanx') subConverterUrl += '&udp=true';
            }

			try {
				const subConverterResponse = await fetch(subConverterUrl, { headers: { 'User-Agent': userAgentHeader } });
				if (!subConverterResponse.ok) return new Response(base64Data, { headers: responseHeaders });
				let subConverterContent = await subConverterResponse.text();
				if (订阅格式 == 'clash') subConverterContent = await clashFix(subConverterContent);
				if (!userAgent.includes('mozilla')) responseHeaders["Content-Disposition"] = `attachment; filename*=utf-8''${encodeURIComponent(FileName)}`;
				return new Response(subConverterContent, { headers: responseHeaders });
			} catch (error) {
				return new Response(base64Data, { headers: responseHeaders });
			}
		}
	}
};

function clashFix(content) {
    // 1. AnyTLS 参数修正
    content = content.replace(/fingerprint: (chrome|firefox|safari|ios|android|edge|360|qq|random)/g, 'client-fingerprint: $1');

    // 2. SS + v2ray-plugin 原生转换逻辑
    if (content.includes('plugin: v2ray-plugin')) {
        let lines = content.includes('\r\n') ? content.split('\r\n') : content.split('\n');
        let result = "";
        for (let line of lines) {
            if (line.includes('type: ss') && line.includes('v2ray-plugin')) {
                try {
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
                        const name = nameMatch ? nameMatch[1] : "SS-Fixed";
                        // 修正：正确的 chacha20-ietf-poly1305
                        result += `  - {name: "${name}", server: ${server}, port: ${port}, type: ss, cipher: chacha20-ietf-poly1305, password: ${password}, udp: true, tls: true, sni: ${host}, skip-cert-verify: true, network: ws, ws-opts: {path: "${path}", headers: {Host: ${host}}}} \n`;
                        continue; 
                    }
                } catch (e) {}
            }
            result += line + '\n';
        }
        content = result;
    }
    // 3. Wireguard 修复
    content = content.replace(/type: wireguard, mtu: 1280, udp: true/g, 'type: wireguard, mtu: 1280, remote-dns-resolve: true, udp: true');
    return content;
}

async function ADD(envadd) {
	var addtext = envadd.replace(/[	"'|\r\n]+/g, '\n').replace(/\n+/g, '\n');
	if (addtext.charAt(0) == '\n') addtext = addtext.slice(1);
	if (addtext.charAt(addtext.length - 1) == '\n') addtext = addtext.slice(0, addtext.length - 1);
	return addtext.split('\n');
}

async function nginx() {
	return `<!DOCTYPE html><html><head><title>Welcome to nginx!</title></head><body><h1>Welcome to nginx!</h1></body></html>`;
}

async function sendMessage(type, ip, add_data = "") {
	if (BotToken !== '' && ChatID !== '') {
		let msg = "";
		const response = await fetch(`http://ip-api.com/json/${ip}?lang=zh-CN`);
		const ipInfo = response.status == 200 ? await response.json() : {};
		msg = `${type}\nIP: ${ip}\n国家: ${ipInfo.country || '未知'}\n${add_data}`;
		let url = "https://api.telegram.org/bot" + BotToken + "/sendMessage?chat_id=" + ChatID + "&parse_mode=HTML&text=" + encodeURIComponent(msg);
		return fetch(url);
	}
}

function base64Decode(str) {
	const bytes = new Uint8Array(atob(str).split('').map(c => c.charCodeAt(0)));
	return new TextDecoder('utf-8').decode(bytes);
}

async function MD5MD5(text) {
	const encoder = new TextEncoder();
	const firstPass = await crypto.subtle.digest('MD5', encoder.encode(text));
	const firstHex = Array.from(new Uint8Array(firstPass)).map(b => b.toString(16).padStart(2, '0')).join('');
	const secondPass = await crypto.subtle.digest('MD5', encoder.encode(firstHex.slice(7, 27)));
	return Array.from(new Uint8Array(secondPass)).map(b => b.toString(16).padStart(2, '0')).join('').toLowerCase();
}

async function proxyURL(proxyURL, url) {
	const URLs = await ADD(proxyURL);
	const fullURL = URLs[Math.floor(Math.random() * URLs.length)];
	let parsedURL = new URL(fullURL);
	let newURL = `${parsedURL.protocol}//${parsedURL.hostname}${parsedURL.pathname}${url.pathname}${parsedURL.search}`;
	let response = await fetch(newURL);
	return new Response(response.body, { status: response.status, headers: response.headers });
}

async function getSUB(api, request, 追加UA, userAgentHeader) {
	if (!api || api.length === 0) return [];
	api = [...new Set(api)];
	let newapi = "";
	let 订阅转换URLs = "";
	let 异常订阅 = "";
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), 2000);
	try {
		const responses = await Promise.allSettled(api.map(apiUrl => getUrl(request, apiUrl, 追加UA, userAgentHeader).then(res => res.ok ? res.text() : Promise.reject(res))));
		for (const [index, response] of responses.entries()) {
			if (response.status === 'fulfilled') {
				const content = response.value || 'null';
				if (content.includes('proxies:')) 订阅转换URLs += "|" + api[index];
				else if (content.includes('outbounds"') && content.includes('inbounds"')) 订阅转换URLs += "|" + api[index];
				else if (content.includes('://')) newapi += content + '\n';
				else if (isValidBase64(content)) newapi += base64Decode(content) + '\n';
			}
		}
	} catch (error) {} finally { clearTimeout(timeout); }
	return [await ADD(newapi + 异常订阅), 订阅转换URLs];
}

async function getUrl(request, targetUrl, 追加UA, userAgentHeader) {
	const newHeaders = new Headers(request.headers);
	newHeaders.set("User-Agent", `v2rayN/6.45 cmliu/CF-Workers-SUB ${追加UA}(${userAgentHeader})`);
	return fetch(new Request(targetUrl, { method: request.method, headers: newHeaders, redirect: "follow" }));
}

function isValidBase64(str) {
	const cleanStr = str.replace(/\s/g, '');
	return /^[A-Za-z0-9+/=]+$/.test(cleanStr);
}

async function 迁移地址列表(env, txt = 'ADD.txt') {
	const 旧数据 = await env.KV.get(`/${txt}`);
	if (旧数据) {
		await env.KV.put(txt, 旧数据);
		await env.KV.delete(`/${txt}`);
		return true;
	}
	return false;
}

async function KV(request, env, txt = 'ADD.txt', guest) {
	const url = new URL(request.url);
	if (request.method === "POST") {
		await env.KV.put(txt, await request.text());
		return new Response("保存成功");
	}
	let content = await env.KV.get(txt) || '';
	return new Response(`<html><body><textarea id="content">${content}</textarea><button onclick="save()">Save</button><script>function save(){fetch(location.href,{method:'POST',body:document.getElementById('content').value}).then(()=>alert('Saved'))}</script></body></html>`, { headers: { "Content-Type": "text/html;charset=utf-8" } });
}
