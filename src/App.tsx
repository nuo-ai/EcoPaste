import { HappyProvider } from "@ant-design/happy-work-theme";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { error } from "@tauri-apps/plugin-log";
import { open } from "@tauri-apps/plugin-shell";
import { ConfigProvider, theme } from "antd";
import { isString } from "lodash-es";
import { RouterProvider } from "react-router-dom";
import { useSnapshot } from "valtio";

const { defaultAlgorithm, darkAlgorithm } = theme;

const App = () => {
	const { appearance } = useSnapshot(globalStore);
	const { restoreState } = useWindowState();
	const [ready, { toggle }] = useBoolean();

	useMount(async () => {
		await restoreState();

		await restoreStore();

		toggle();

		// 生成 antd 的颜色变量
		generateColorVars();
	});

	// 监听语言的变化
	useImmediateKey(globalStore.appearance, "language", i18n.changeLanguage);

	// 监听是否是暗黑模式
	useImmediateKey(globalStore.appearance, "isDark", (value) => {
		if (value) {
			document.documentElement.classList.add("dark");
		} else {
			document.documentElement.classList.remove("dark");
		}
	});

	// 监听显示窗口的事件
	useTauriListen(LISTEN_KEY.SHOW_WINDOW, ({ payload }) => {
		const appWindow = getCurrentWebviewWindow();

		if (appWindow.label !== payload) return;

		showWindow();
	});

	// 监听关闭数据库的事件
	useTauriListen(LISTEN_KEY.CLOSE_DATABASE, closeDatabase);

	// 生产环境禁用默认的右键菜单
	useEventListener("contextmenu", (event) => {
		if (isDev()) return;

		event.preventDefault();
	});

	// 链接跳转到系统浏览器
	useEventListener("click", (event) => {
		const link = (event.target as HTMLElement).closest("a");

		if (!link) return;

		const { href, target } = link;

		if (target === "_blank") return;

		event.preventDefault();

		if (!isURL(href)) return;

		open(href);
	});

	// esc 或者 meta.w 隐藏窗口
	useOSKeyPress(["esc", "meta.w"], hideWindow);

	// 监听 promise 的错误，输出到日志
	useEventListener("unhandledrejection", ({ reason }) => {
		const message = isString(reason) ? reason : JSON.stringify(reason);

		error(message);
	});

	return (
		<ConfigProvider
			locale={getAntdLocale(appearance.language)}
			theme={{
				algorithm: appearance.isDark ? darkAlgorithm : defaultAlgorithm,
			}}
		>
			<HappyProvider>
				{ready && <RouterProvider router={router} />}
			</HappyProvider>
		</ConfigProvider>
	);
};

export default App;
