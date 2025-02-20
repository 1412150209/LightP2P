import {App as Ap, ConfigProvider, theme} from "antd";
import HeaderComponent from "./components/Header.tsx";
import ContentComponent from "./components/Content.tsx";
import "./App.css"


function App() {
    return (
        <ConfigProvider
            theme={{
                algorithm: theme.darkAlgorithm
            }}
        >
            <Ap message={{maxCount: 3}} notification={{maxCount: 2}}
                style={{
                    display: "flex",
                    flexDirection: "column",
                    height: "100vh"
                }}
            >
                <HeaderComponent/>
                <ContentComponent/>
            </Ap>
        </ConfigProvider>
    )
}

export default App;
