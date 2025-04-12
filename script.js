async function sendRequest() {
    const url = document.getElementById('url').value;
    const method = document.getElementById('method').value;
    const headersInput = document.getElementById('headers').value;
    const bodyInput = document.getElementById('body').value;
    const errorMessage = document.getElementById('error-message');
    const loader = document.getElementById('loader');
    const sendBtn = document.querySelector('.send-btn');

    errorMessage.textContent = '';
    errorMessage.classList.remove('show');
    sendBtn.disabled = true;

    if (!url) {
        errorMessage.textContent = '请输入有效的 URL';
        errorMessage.classList.add('show');
        sendBtn.disabled = false;
        return;
    }

    const options = {
        method,
        headers: {},
        mode: 'cors',
    };

    try {
        if (headersInput) {
            options.headers = JSON.parse(headersInput);
        }
    } catch (e) {
        errorMessage.textContent = '请求头格式错误，应为 JSON 格式';
        errorMessage.classList.add('show');
        sendBtn.disabled = false;
        return;
    }

    if (bodyInput && ['POST', 'PUT'].includes(method)) {
        try {
            JSON.parse(bodyInput);
            options.body = bodyInput;
        } catch (e) {
            errorMessage.textContent = '请求体格式错误，应为 JSON 格式';
            errorMessage.classList.add('show');
            sendBtn.disabled = false;
            return;
        }
    }

    loader.classList.add('active');

    const startTime = performance.now();

    try {
        const response = await fetch(url, options);
        const endTime = performance.now();
        let responseBody = await response.text();

        try {
            const parsed = JSON.parse(responseBody);
            responseBody = JSON.stringify(parsed, null, 2);
        } catch (e) {
            // 非 JSON 保持原样
        }

        const responseHeaders = {};
        response.headers.forEach((value, key) => {
            responseHeaders[key] = value;
        });

        document.getElementById('response-body').textContent = responseBody;
        document.getElementById('response-headers').textContent = JSON.stringify(responseHeaders, null, 2);
        document.getElementById('response-info').textContent = JSON.stringify({
            status: response.status,
            statusText: response.statusText,
            time: `${(endTime - startTime).toFixed(2)} ms`,
        }, null, 2);

        showTab('body');
    } catch (error) {
        errorMessage.textContent = `请求失败: ${error.message}`;
        errorMessage.classList.add('show');
        document.getElementById('response-body').textContent = '';
        document.getElementById('response-headers').textContent = '';
        document.getElementById('response-info').textContent = '';
        showTab('body');
    } finally {
        loader.classList.remove('active');
        sendBtn.disabled = false;
    }
}

function parseCurlCommand() {
    const curlInput = document.getElementById('curl-input').value.trim();
    const errorMessage = document.getElementById('error-message');
    errorMessage.textContent = '';
    errorMessage.classList.remove('show');

    if (!curlInput.startsWith('curl ')) {
        errorMessage.textContent = '请输入有效的 cURL 命令（以 "curl " 开头）';
        errorMessage.classList.add('show');
        return null;
    }

    try {
        // 简单解析逻辑，假设命令格式规范
        const args = curlInput.replace(/curl\s+/, '').match(/(?:[^\s"]+|"[^"]*")+/g) || [];
        let url = '';
        let method = 'GET';
        const headers = {};
        let body = '';

        for (let i = 0; i < args.length; i++) {
            const arg = args[i].replace(/^"|"$/g, '');
            if (arg.startsWith('http://') || arg.startsWith('https://')) {
                url = arg;
            } else if (arg === '-X' || arg === '--request') {
                method = args[++i].toUpperCase();
            } else if (arg === '-H' || arg === '--header') {
                const header = args[++i].replace(/^"|"$/g, '');
                const [key, value] = header.split(':').map(s => s.trim());
                headers[key] = value;
            } else if (arg === '-d' || arg === '--data' || arg === '--data-raw') {
                body = args[++i].replace(/^"|"$/g, '');
            }
        }

        if (!url) {
            errorMessage.textContent = 'cURL 命令中未找到有效的 URL';
            errorMessage.classList.add('show');
            return null;
        }

        return { url, method, headers, body };
    } catch (e) {
        errorMessage.textContent = '解析 cURL 命令失败，请检查格式';
        errorMessage.classList.add('show');
        return null;
    }
}

function showTab(tabId) {
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.response-content').forEach(content => content.classList.remove('active'));

    document.querySelector(`.tab[onclick="showTab('${tabId}')"]`).classList.add('active');
    document.getElementById(`response-${tabId}`).classList.add('active');
}

function toggleTheme() {
    document.body.classList.toggle('dark');
    const icon = document.querySelector('.theme-icon');
    icon.textContent = document.body.classList.contains('dark') ? '☀️' : '🌙';
}

function validateUrl() {
    const urlInput = document.getElementById('url').value;
    const status = document.querySelector('.url-status');
    const urlPattern = /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w- ./?%&=]*)?$/i;

    if (!urlInput) {
        status.textContent = '';
        status.classList.remove('valid', 'invalid');
        return;
    }

    if (urlPattern.test(urlInput)) {
        status.textContent = '✓';
        status.classList.add('valid');
        status.classList.remove('invalid');
    } else {
        status.textContent = '无效 URL';
        status.classList.add('invalid');
        status.classList.remove('valid');
    }
}

function validateJson(fieldId) {
    const input = document.getElementById(fieldId).value;
    if (!input) return;

    try {
        JSON.parse(input);
    } catch (e) {
        const errorMessage = document.getElementById('error-message');
        errorMessage.textContent = `${fieldId === 'headers' ? '请求头' : '请求体'}格式错误`;
        errorMessage.classList.add('show');
        setTimeout(() => errorMessage.classList.remove('show'), 2000);
    }
}

// 涟漪效果
document.querySelector('.send-btn').addEventListener('click', function(e) {
    const ripple = this.querySelector('.ripple');
    ripple.classList.remove('animate');

    const rect = this.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
    ripple.style.top = `${e.clientY - rect.top - size / 2}px`;

    ripple.classList.add('animate');
});
