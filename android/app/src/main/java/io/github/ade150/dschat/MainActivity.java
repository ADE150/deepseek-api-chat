package io.github.ade150.dschat;

import android.graphics.Rect;
import android.os.Build;
import android.os.Bundle;
import android.view.View;

import com.getcapacitor.BridgeActivity;

import java.util.Collections;

public class MainActivity extends BridgeActivity {
    private static final int EDGE_SWIPE_WIDTH_DP = 32;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        applyGestureExclusion();
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            applyGestureExclusion();
        }
    }

    /** 让左边缘 32dp 的右滑交给 WebView，避免被系统全局返回手势截获。 */
    private void applyGestureExclusion() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
            return;
        }
        final View decor = getWindow().getDecorView();
        decor.post(() -> {
            int width = decor.getWidth();
            int height = decor.getHeight();
            if (width <= 0 || height <= 0) {
                return;
            }
            int edge = Math.round(EDGE_SWIPE_WIDTH_DP * getResources().getDisplayMetrics().density);
            decor.setSystemGestureExclusionRects(
                Collections.singletonList(new Rect(0, 0, edge, height))
            );
        });
    }
}
