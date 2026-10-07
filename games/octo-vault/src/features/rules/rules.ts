import type { Feature } from 'slot-sdk';
import { paylines } from '../../config/paylines';
import { rulesConfig } from '../../config/rules.config';
import { createPaytable } from './PaytableView';

/**
 * The info button and the Rules popup it opens: the paytable at the current bet and what the
 * Wild and the Scatter do. Open only between rounds, like a purchase, so it never hides a spin.
 */
export function rules(): Feature {
  return {
    install(context) {
      const { popup, model } = context;
      const button = context.hud.addIconButton('info', 'infoIcon');
      button.onPress(() => {
        const body = createPaytable(model.bet, (id) => context.assets.symbolTexture(id));
        void popup
          .open({
            title: rulesConfig.title,
            message: rulesConfig.message.replace('{lines}', String(paylines.length)),
            body,
            buttons: [{ label: rulesConfig.close, value: 'close' }],
          })
          .then(() => {
            body.destroy({ children: true });
          });
      });
      context.events.on('roundStateChanged', (state) => {
        button.setEnabled(state === 'idle');
      });
    },
  };
}
