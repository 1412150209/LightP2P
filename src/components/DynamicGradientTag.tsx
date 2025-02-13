// DynamicGradientTag.tsx
import {Tag} from "antd";
import {ComponentProps, forwardRef} from "react";
import "./gradient-tag.css"; // 引入 CSS 样式

const DynamicGradientTag = forwardRef<HTMLDivElement, ComponentProps<typeof Tag>>(
    ({className, ...props}, ref) => {
        return (
            <Tag
                {...props}
                ref={ref}
                className={`gradient-tag ${className || ""}`}
            />
        );
    }
);

export default DynamicGradientTag;