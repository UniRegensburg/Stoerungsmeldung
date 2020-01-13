package com.example.myuse.facilitymanagementtool;

import android.app.AlertDialog;
import android.app.Application;
import android.app.Dialog;
import android.content.ActivityNotFoundException;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.pm.ActivityInfo;
import android.database.Cursor;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.drawable.Drawable;
import android.net.Uri;
import android.os.Handler;
import android.provider.MediaStore;
import android.support.v7.app.AppCompatActivity;
import android.os.Bundle;
import android.util.Log;
import android.view.Menu;
import android.view.MenuItem;
import android.view.View;
import android.widget.ArrayAdapter;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ImageView;
import android.widget.Spinner;
import android.widget.TextView;
import android.widget.Toast;

import java.io.InputStream;

public class MainActivity extends AppCompatActivity {
    private String[] arraySpinner1;
    private String[] arraySpinner2;
    private String[] arraySpinner3;
    private String[] arraySpinner4;
    public static final int REQUEST_IMAGE_CAPTURE = 1;
    public static final int REQUEST_GALLERY = 2;
    private ImageView photo1;
    private ImageView photo2;
    private ImageView photo3;
    private int photocounter = 0;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        super.setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_PORTRAIT);
        setContentView(R.layout.activity_main);

        photo1 = (ImageView)findViewById(R.id.image1);
        photo2 = (ImageView)findViewById(R.id.image2);
        photo3 = (ImageView)findViewById(R.id.image3);

        setSpinners();

        Button callButton = (Button)findViewById(R.id.button);
        callButton.setOnClickListener(new View.OnClickListener() {

            public void onClick(View v) {
                AlertDialog alertDialog = new AlertDialog.Builder(MainActivity.this).create();
                alertDialog.setTitle("Notfall Anruf");
                alertDialog.setMessage("Wollen Sie wirklich die Notfall-Zentrale anrufen?");
                alertDialog.setButton(AlertDialog.BUTTON_POSITIVE, "Ja",
                        new DialogInterface.OnClickListener() {
                            public void onClick(DialogInterface dialog, int which) {
                                dialog.dismiss();
                                try {
                                    Intent callIntent = new Intent(Intent.ACTION_CALL);
                                    callIntent.setData(Uri.parse("tel:09419433333"));
                                    startActivity(callIntent);
                                } catch (ActivityNotFoundException activityException) {
                                    Log.e("Calling a Phone Number", "Call failed", activityException);
                                }
                            }
                        });
                alertDialog.setButton(AlertDialog.BUTTON_NEGATIVE, "Nein",
                        new DialogInterface.OnClickListener() {
                            public void onClick(DialogInterface dialog, int which) {
                                dialog.dismiss();
                            }
                        });
                alertDialog.show();
            }
        });

        ImageView Photo = (ImageView)findViewById(R.id.imageView);
        Photo.setOnClickListener(new View.OnClickListener() {
            public void onClick(View v) {
                dispatchTakePictureIntent();
            }
        });

        ImageView gallery = (ImageView)findViewById(R.id.gallery);
        gallery.setOnClickListener(new View.OnClickListener() {
            public void onClick(View v) {
                pickImage();
            }
        });

        TextView tw = (TextView) findViewById(R.id.username);
        String id = getIntent().getStringExtra("username");
        if(id!=null)tw.setText(id);

        Button send_button = (Button)findViewById(R.id.button2);
        send_button.setOnClickListener(new View.OnClickListener() {
            public void onClick(View v) {
                Toast.makeText(getApplicationContext(), "wird gesendet",Toast.LENGTH_LONG).show();
                Handler mHandler = new Handler();
                mHandler.postDelayed(new Runnable() {
                    public void run() {
                        finish();
                        System.exit(0);
                    }
                }, 3500);
            }
        });

    }

    public void pickImage() {
        Intent intent = new Intent(Intent.ACTION_GET_CONTENT);
        intent.setType("image/*");
        startActivityForResult(intent, REQUEST_GALLERY);
    }

    private void dispatchTakePictureIntent() {
        Intent intent = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
        if (intent.resolveActivity(getPackageManager()) != null) {
            startActivityForResult(intent, REQUEST_IMAGE_CAPTURE);
        }
    }

    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        if(resultCode != RESULT_OK)return;
        if (requestCode == REQUEST_IMAGE_CAPTURE) {
            Bundle extras = data.getExtras();
            Bitmap imageBitmap = (Bitmap) extras.get("data");
            switch (photocounter){
                case 0: photo1.setImageBitmap(imageBitmap);photocounter++;break;
                case 1: photo2.setImageBitmap(imageBitmap);photocounter++;break;
                case 2: photo3.setImageBitmap(imageBitmap);photocounter++;break;
                default:
                    Toast.makeText(getApplicationContext(),"Maximum von drei Bildern erreicht",Toast.LENGTH_LONG).show();
                    break;
            }
        }
        if (requestCode == REQUEST_GALLERY) {
            Toast.makeText(getApplicationContext(),"Gallerie Import nicht implementiert",Toast.LENGTH_LONG).show();
        }
    }

    @Override
    public boolean onCreateOptionsMenu(Menu menu) {
        // Inflate the menu; this adds items to the action bar if it is present.
        getMenuInflater().inflate(R.menu.menu_main, menu);
        return true;
    }

    @Override
    public boolean onOptionsItemSelected(MenuItem item) {
        // Handle action bar item clicks here. The action bar will
        // automatically handle clicks on the Home/Up button, so long
        // as you specify a parent activity in AndroidManifest.xml.
        int id = item.getItemId();

        //noinspection SimplifiableIfStatement
        if (id == R.id.action_settings) {
            Intent intent = new Intent(getApplicationContext(), insert.class);
            intent.putExtra("went_back", true);
            startActivity(intent);
            return true;
        }

        return super.onOptionsItemSelected(item);
    }

    private void setSpinners(){
        this.arraySpinner1 = new String[] {
                "PHT4","RWSG", "SHGB","ZHGB"
        };
        this.arraySpinner2 = new String[] {
                "EG", "OG1", "OG2", "UG1"
        };
        this.arraySpinner3 = new String[] {
                "1", "2", "3", "4", "5"
        };
        this.arraySpinner4 = new String[] {
                "E Nord", "E Süd", "Fenster/Türen", "Heizung","Kältetechnik", "Nachrichtentechnik", "Sanitär"
        };
        Spinner s = (Spinner) findViewById(R.id.spinner);
        ArrayAdapter<String> adapter = new ArrayAdapter<String>(this,
                android.R.layout.simple_spinner_item, arraySpinner1);
        s.setAdapter(adapter);
        Spinner s2 = (Spinner) findViewById(R.id.spinner2);
        ArrayAdapter<String> adapter2 = new ArrayAdapter<String>(this,
                android.R.layout.simple_spinner_item, arraySpinner2);
        s2.setAdapter(adapter2);
        Spinner s3 = (Spinner) findViewById(R.id.spinner3);
        ArrayAdapter<String> adapter3 = new ArrayAdapter<String>(this,
                android.R.layout.simple_spinner_item, arraySpinner3);
        s3.setAdapter(adapter3);
        Spinner s4 = (Spinner) findViewById(R.id.spinner4);
        ArrayAdapter<String> adapter4 = new ArrayAdapter<String>(this,
                android.R.layout.simple_spinner_item, arraySpinner4);
        s4.setAdapter(adapter4);
    }

}

