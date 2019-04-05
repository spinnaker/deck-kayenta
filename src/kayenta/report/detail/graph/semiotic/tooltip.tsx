import * as React from 'react';
import * as ReactTooltip from 'react-tooltip';

export interface ITooltipProps {
  x?: number;
  y?: number;
  content?: any;
}

export default class Tooltip extends React.Component<ITooltipProps> {
  // private tooltipTarget = React.createRef<HTMLDivElement>()
  private tooltipTarget: HTMLDivElement;

  componentDidUpdate(prevProps: ITooltipProps) {
    const target = this.tooltipTarget;
    if (prevProps.content && !this.props.content) {
      ReactTooltip.hide(target);
    } else if (this.props.content) {
      ReactTooltip.show(target);
    }
  }

  render() {
    const { x, y, content } = this.props;
    const tooltipTargetStyle = {
      left: x ? x : 0,
      top: y ? y : 0,
      height: 1,
      width: 1,
      opacity: 0,
      pointerEvents: 'none',
      position: 'absolute',
      zIndex: 10,
    } as React.CSSProperties;

    const containerStyle = {
      pointerEvents: 'none',
    } as React.CSSProperties;

    return (
      <div style={containerStyle}>
        <div data-tip={'tooltip'} style={tooltipTargetStyle} ref={el => (this.tooltipTarget = el)} />
        <ReactTooltip type={'light'} border={true}>
          {content ? content : null}
        </ReactTooltip>
      </div>
    );
  }
}
