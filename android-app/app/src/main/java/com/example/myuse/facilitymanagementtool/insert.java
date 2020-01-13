package com.example.myuse.facilitymanagementtool;

import android.content.Context;
import android.content.Intent;
import android.content.pm.ActivityInfo;
import android.support.v7.app.AppCompatActivity;
import android.os.Bundle;
import android.view.Menu;
import android.view.MenuItem;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.Toast;

import java.io.BufferedReader;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStreamReader;

public class insert extends AppCompatActivity {
    private String text = "";
    public static String filename = "username.txt";
    static final int READ_BLOCK_SIZE = 100;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        super.setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_PORTRAIT);
        setContentView(R.layout.activity_insert);

        final EditText edt = (EditText)findViewById(R.id.username);

        boolean went_back = getIntent().getBooleanExtra("went_back",false);
        if(went_back){
            getIntent().putExtra("went_back",false);
        }
        else {
            readfirst();
        }
        Button button = (Button)findViewById(R.id.enter_button);
        button.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                text = edt.getText().toString();
                if(text.length()!=8){
                    Toast.makeText(getApplicationContext(),"falsche Kennung",Toast.LENGTH_LONG).show();
                    return;
                }
                FileOutputStream outputStream;
                try {
                    outputStream = openFileOutput(filename, Context.MODE_PRIVATE);
                    outputStream.write(text.getBytes());
                    outputStream.close();
                    startMain();
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        });
    }

    private void readfirst(){
            //reading text from file
            try {
                FileInputStream fileIn=openFileInput(filename);
                InputStreamReader InputRead= new InputStreamReader(fileIn);

                char[] inputBuffer= new char[READ_BLOCK_SIZE];
                String s="";
                int charRead;

                while ((charRead=InputRead.read(inputBuffer)) > 0) {
                    // char to string conversion
                    String readstring=String.copyValueOf(inputBuffer,0,charRead);
                    s +=readstring;
                }
                InputRead.close();

                if(s.length()==8){
                    text=s;
                    startMain();
                }

            } catch (Exception e) {
                e.printStackTrace();
            }
    }

    private void startMain(){
        Intent intent = new Intent(getApplicationContext(), MainActivity.class);
        intent.putExtra("username", text);
        startActivity(intent);
    }

}
